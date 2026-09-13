"""Run GLSim with the payable-value context shim used by this project.

The v0.29 simulator stores a transaction's user value in its receipt but does
not pass it into ``SimEngine.call_method``. The production GenVM runner does
populate ``gl.message.value``. This narrow adapter restores that simulator
plumbing so the integration suite tests the real payable contract path rather
than bypassing deposits.

When a newer GLSim release propagates the value itself, this file can be
removed from the command without changing either contract.
"""

from __future__ import annotations

import runpy
import sys
import os
import tempfile
import threading

import glsim.engine as glsim_engine
import glsim.tx_decoder as glsim_tx_decoder
from glsim.engine import SimEngine
from glsim.state import StateStore
from gltest.direct import loader
from gltest.direct.vm import VMContext


for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")


_original_call_method = SimEngine.call_method
_original_refresh_gl_message = VMContext._refresh_gl_message
_original_deploy_contract = glsim_engine.deploy_contract
_original_decode_raw_transaction = glsim_tx_decoder.decode_raw_transaction
_original_add_transaction = StateStore.add_transaction
_decoded_transaction = threading.local()


def _deploy_contract_without_calldata_proxy(*args, **kwargs):
    """Give GLSim the concrete instance expected by its class cache.

    ``gltest.direct.deploy_contract`` intentionally returns a calldata proxy for
    direct-test ergonomics.  GLSim treats that return value as the persistent
    contract instance and derives the ABI from its class, so an uncached first
    deployment records the proxy's empty ABI.  The simulator already performs
    its own calldata roundtrip, making the proxy redundant here.
    """

    deployed = _original_deploy_contract(*args, **kwargs)
    try:
        return object.__getattribute__(deployed, "_instance")
    except AttributeError:
        return deployed


glsim_engine.deploy_contract = _deploy_contract_without_calldata_proxy


def _decode_raw_transaction_with_value(raw_hex):
    decoded = _original_decode_raw_transaction(raw_hex)
    _decoded_transaction.value = int(decoded.get("value", 0))
    return decoded


def _add_transaction_with_value(state, transaction):
    # GLSim 0.29 decodes the outer Ethereum value but drops it before creating
    # its transaction record.  Retain it there so the existing call shim can
    # recover the correct payable value for this exact recipient and sender.
    transaction.value = int(getattr(_decoded_transaction, "value", 0))
    _decoded_transaction.value = 0
    return _original_add_transaction(state, transaction)


glsim_tx_decoder.decode_raw_transaction = _decode_raw_transaction_with_value
StateStore.add_transaction = _add_transaction_with_value


def _canonical_timestamp(value) -> str:
    if isinstance(value, str) and len(value) >= 20 and value[19] == ".":
        return value[:19] + "Z"
    if isinstance(value, str) and len(value) == 20 and value.endswith("Z"):
        return value
    return "2025-01-01T00:00:00Z"


def _refresh_with_canonical_timestamp(vm):
    _original_refresh_gl_message(vm)
    try:
        import genlayer.gl as gl
    except ImportError:
        # GLSim initializes its VM before the first contract load installs the
        # pinned SDK path. There is no contract message to normalize yet.
        return

    if getattr(gl, "message_raw", None) is not None:
        gl.message_raw["datetime"] = _canonical_timestamp(vm._datetime)


VMContext._refresh_gl_message = _refresh_with_canonical_timestamp


def _latest_user_value(engine: SimEngine, contract_address: str, sender: str | None) -> int:
    candidates = []
    for transaction in engine.state.transactions.values():
        if not transaction.to_address:
            continue
        if transaction.to_address.lower() != contract_address.lower():
            continue
        if sender and transaction.from_address.lower() != sender.lower():
            continue
        candidates.append(transaction)
    if not candidates:
        return 0
    return int(max(candidates, key=lambda item: item.gl_tx_id).value)


def _call_method_with_value(self, contract_address, method_name, args=None, kwargs=None, sender=None):
    import genlayer.gl as gl
    from genlayer.py.types import u256

    old_value = self.vm._value
    old_raw_value = None
    if getattr(gl, "message_raw", None) is not None:
        old_raw_value = gl.message_raw.get("value", 0)
    value = _latest_user_value(self, contract_address, sender)
    self.vm._value = value
    self.vm._refresh_gl_message()
    if getattr(gl, "message_raw", None) is not None:
        gl.message_raw["value"] = u256(value)
    try:
        return _original_call_method(self, contract_address, method_name, args, kwargs, sender)
    finally:
        self.vm._value = old_value
        self.vm._refresh_gl_message()
        if getattr(gl, "message_raw", None) is not None and old_raw_value is not None:
            gl.message_raw["value"] = old_raw_value


SimEngine.call_method = _call_method_with_value


def _windows_safe_message_injection(vm):
    """Keep the GenVM stdin file alive until the Windows handle is closed."""

    from genlayer.py import calldata
    from genlayer.py.types import Address

    sender = vm.sender
    if isinstance(sender, bytes):
        sender = Address(sender)
    contract_address = vm._contract_address
    if isinstance(contract_address, bytes):
        contract_address = Address(contract_address)
    origin = vm.origin
    if isinstance(origin, bytes):
        origin = Address(origin)
    message_data = {
        "contract_address": contract_address,
        "sender_address": sender,
        "origin_address": origin,
        "stack": [],
        "value": vm._value,
        "datetime": _canonical_timestamp(vm._datetime),
        "is_init": False,
        "chain_id": vm._chain_id,
        "entry_kind": 0,
        "entry_data": b"",
        "entry_stage_data": None,
    }
    fd, path = tempfile.mkstemp()
    os.write(fd, calldata.encode(message_data))
    os.lseek(fd, 0, os.SEEK_SET)
    vm._original_stdin_fd = os.dup(0)
    os.dup2(fd, 0)
    paths = getattr(vm, "_slashcourt_temp_message_paths", [])
    paths.append(path)
    vm._slashcourt_temp_message_paths = paths
    os.close(fd)


_original_cleanup = VMContext._cleanup_after_deactivate


def _cleanup_with_deferred_temp_files(vm):
    # GLSim keeps loaded contract classes in a process-wide cache.  The direct
    # runner normally removes every pinned-SDK and ``_contract_`` module when a
    # VM context exits, which is correct for isolated direct tests.  Schema
    # discovery uses a short-lived nested VM, though, so that cleanup otherwise
    # leaves GLSim's cached class tied to modules which can no longer be
    # imported.  A later deployment then mixes two SDK module generations and
    # loses the contract storage descriptor.  Preserve only the modules and
    # paths that the nested cleanup is about to evict; the wrapper process is
    # already pinned to one SDK version by the contracts under test.
    sdk_roots = [path for path in sys.path if "gltest-direct" in path]
    preserved_modules = {}
    for name, module in tuple(sys.modules.items()):
        module_file = getattr(module, "__file__", None) or ""
        if name.startswith(("_contract_", "_deployed_")) or any(
            module_file.startswith(root) for root in sdk_roots
        ):
            preserved_modules[name] = module

    _original_cleanup(vm)

    for path in reversed(sdk_roots):
        if path not in sys.path:
            sys.path.insert(0, path)
    sys.modules.update(preserved_modules)

    for path in getattr(vm, "_slashcourt_temp_message_paths", []):
        try:
            os.unlink(path)
        except (FileNotFoundError, PermissionError):
            pass
    vm._slashcourt_temp_message_paths = []


loader._inject_message_to_fd0 = _windows_safe_message_injection
VMContext._cleanup_after_deactivate = _cleanup_with_deferred_temp_files

if __name__ == "__main__":
    runpy.run_module("glsim", run_name="__main__")
