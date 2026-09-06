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

from glsim.engine import SimEngine
from gltest.direct import loader
from gltest.direct.vm import VMContext


_original_call_method = SimEngine.call_method


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
        "datetime": vm._datetime,
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
    _original_cleanup(vm)
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
