"""Direct-mode fixtures plus the Windows stdin cleanup shim."""

import os
import tempfile
import json

import pytest

from gltest.direct import loader
from gltest.direct.vm import VMContext


def _windows_safe_message_injection(vm):
    """Keep the injected stdin temp file alive until its Windows handle closes."""

    try:
        from genlayer.py import calldata
        from genlayer.py.types import Address
    except ImportError:
        return

    sender_address = vm.sender
    if isinstance(sender_address, bytes):
        sender_address = Address(sender_address)
    contract_address = vm._contract_address
    if isinstance(contract_address, bytes):
        contract_address = Address(contract_address)
    origin_address = vm.origin
    if isinstance(origin_address, bytes):
        origin_address = Address(origin_address)

    message_data = {
        "contract_address": contract_address,
        "sender_address": sender_address,
        "origin_address": origin_address,
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
    try:
        os.write(fd, calldata.encode(message_data))
        os.lseek(fd, 0, os.SEEK_SET)
        vm._original_stdin_fd = os.dup(0)
        os.dup2(fd, 0)
        paths = getattr(vm, "_slash_court_temp_message_paths", [])
        paths.append(path)
        vm._slash_court_temp_message_paths = paths
    finally:
        os.close(fd)


_original_cleanup = VMContext._cleanup_after_deactivate
loader._inject_message_to_fd0 = _windows_safe_message_injection


def _cleanup_with_deferred_temp_files(vm):
    _original_cleanup(vm)
    for path in getattr(vm, "_slash_court_temp_message_paths", []):
        try:
            os.unlink(path)
        except (FileNotFoundError, PermissionError):
            pass
    vm._slash_court_temp_message_paths = []


VMContext._cleanup_after_deactivate = _cleanup_with_deferred_temp_files


def as_address(address):
    """Encode direct fixture bytes as an SDK Address value."""

    if hasattr(address, "as_hex"):
        return address
    from genlayer.py.types import Address

    return Address(address)


RULEBOOK_TEXT = """R1 — DUTY_WINDOW: perform the keeper duty within the agreed window.
R2 — AUTHORIZED_PAYLOAD: use the authorized target and action.
R3 — FAILOVER_DUTY: attempt the configured secondary provider when the primary fails.
R4 — EXTERNAL_OUTAGE_EXEMPTION: a widespread outage with unavailable mitigation excuses the miss.
R5 — EVIDENCE_INTEGRITY: fabricated or contradictory signed evidence is misconduct.
R6 — BURDEN_OF_PROOF: material uncertainty resolves to insufficient evidence.
R7 — PROPORTIONALITY: map classification to the fixed commitment penalty."""


@pytest.fixture
def wired_protocol(direct_vm, direct_deploy, direct_owner):
    vault = direct_deploy("contracts/operator_bond_vault.py")
    # The direct harness keeps the runner's single-contract registry in the
    # host process. Reset it between the two separately deployed contracts;
    # full GenVM and GLSim isolate each deployed contract naturally.
    try:
        from genlayer.gl import genvm_contracts

        genvm_contracts.__known_contract__ = None
    except ImportError:
        pass
    court = direct_deploy("contracts/slash_court.py")
    direct_vm.sender = direct_owner
    vault.configure_court(court.address)
    court.configure_bond_vault(vault.address)
    court.create_initial_rulebook(RULEBOOK_TEXT, "sha256:slashcourt-rulebook-v1")
    court.configure_approved_evidence_domains(
        json.dumps(["evidence.example.com", "status.example.org"])
    )
    return vault, court


@pytest.fixture
def vault_contract(direct_deploy):
    return direct_deploy("contracts/operator_bond_vault.py")


@pytest.fixture
def court_contract(direct_deploy):
    return direct_deploy("contracts/slash_court.py")
