from tests.direct.conftest import as_address
from tests.direct.test_bond_accounting import _fund_operator


def test_duplicate_commitment_and_invalid_state_transitions_are_rejected(
    vault_contract, direct_vm, direct_alice, direct_bob, direct_charlie
):
    vault = vault_contract
    _fund_operator(vault, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    args = (
        "commitment-lifecycle",
        as_address(direct_bob),
        "Keeper maintenance",
        "scheduled-trigger",
        "2099-01-01T00:00:00Z",
        "2099-01-02T00:00:00Z",
        1,
        20,
        "maintenance-action",
    )
    vault.create_commitment(*args)
    with direct_vm.expect_revert("commitment id already exists"):
        vault.create_commitment(*args)
    with direct_vm.expect_revert("invalid duty-report state"):
        vault.record_duty_result("commitment-lifecycle", "did-not-run")

    direct_vm.sender = direct_bob
    vault.accept_commitment("commitment-lifecycle")
    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("duty-report authorization required"):
        vault.record_duty_result("commitment-lifecycle", "did-not-run")


def test_disputed_commitment_keeps_exposure_locked(
    vault_contract, direct_vm, direct_owner, direct_alice, direct_bob, direct_charlie
):
    vault = vault_contract
    direct_vm.sender = direct_owner
    vault.configure_court(as_address(direct_charlie))
    _fund_operator(vault, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    vault.create_commitment(
        "commitment-disputed",
        as_address(direct_bob),
        "Keeper maintenance",
        "scheduled-trigger",
        "2099-01-01T00:00:00Z",
        "2099-01-02T00:00:00Z",
        1,
        40,
        "maintenance-action",
    )
    direct_vm.sender = direct_bob
    vault.accept_commitment("commitment-disputed")
    direct_vm.sender = direct_charlie
    vault.bind_case("case-disputed", "commitment-disputed")
    commitment = vault.get_commitment("commitment-disputed")
    balance = vault.get_balance_breakdown(as_address(direct_alice))
    assert commitment["status"] == "DISPUTED"
    assert balance["locked_exposure"] == 40
    assert balance["available_bond"] == 60
