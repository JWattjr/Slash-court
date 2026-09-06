import pytest

from tests.direct.conftest import as_address


def _fund_operator(vault, direct_vm, operator, amount=100):
    direct_vm.sender = operator
    vault.register_operator("https://evidence.example.com/operators/keeper-a.json")
    direct_vm.value = amount
    vault.deposit_bond()
    direct_vm.value = 0


def test_duplicate_registration_zero_deposit_and_top_up(vault_contract, direct_vm, direct_alice):
    vault = vault_contract
    direct_vm.sender = direct_alice
    vault.register_operator("https://evidence.example.com/operators/keeper-a.json")
    with direct_vm.expect_revert("operator already registered"):
        vault.register_operator("https://evidence.example.com/operators/keeper-a.json")
    with direct_vm.expect_revert("bond deposit must be positive"):
        vault.deposit_bond()
    direct_vm.value = 40
    vault.deposit_bond()
    direct_vm.value = 0
    direct_vm.value = 60
    vault.top_up_bond()
    direct_vm.value = 0
    assert vault.get_balance_breakdown(as_address(direct_alice))["available_bond"] == 100


def test_commitment_locks_exposure_and_prevents_overdraw(vault_contract, direct_vm, direct_alice, direct_bob):
    vault = vault_contract
    _fund_operator(vault, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    vault.create_commitment(
        "commitment-1",
        as_address(direct_bob),
        "Hourly keeper maintenance",
        "scheduled-trigger-1",
        "2099-01-01T00:00:00Z",
        "2099-01-02T00:00:00Z",
        1,
        20,
        "maintenance-action-1",
    )
    breakdown = vault.get_balance_breakdown(as_address(direct_alice))
    assert breakdown["available_bond"] == 80
    assert breakdown["locked_exposure"] == 20
    with direct_vm.expect_revert("insufficient available bond"):
        vault.create_commitment(
            "commitment-2",
            as_address(direct_bob),
            "Second keeper duty",
            "scheduled-trigger-2",
            "2099-01-01T00:00:00Z",
            "2099-01-02T00:00:00Z",
            1,
            81,
            "maintenance-action-2",
        )


def test_only_beneficiary_accepts_and_undisputed_release_unlocks(vault_contract, direct_vm, direct_alice, direct_bob, direct_charlie):
    vault = vault_contract
    _fund_operator(vault, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    vault.create_commitment(
        "commitment-release",
        as_address(direct_bob),
        "Keeper maintenance",
        "scheduled-trigger",
        "2020-01-01T00:00:00Z",
        "2020-01-02T00:00:00Z",
        1,
        20,
        "maintenance-action",
    )
    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("beneficiary authorization required"):
        vault.accept_commitment("commitment-release")
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("commitment offer expired"):
        vault.accept_commitment("commitment-release")
    direct_vm.sender = direct_alice
    vault.cancel_unaccepted_commitment("commitment-release")

    # A fresh offer demonstrates the normal acceptance transition.
    direct_vm.sender = direct_alice
    vault.create_commitment(
        "commitment-release-2",
        as_address(direct_bob),
        "Keeper maintenance",
        "scheduled-trigger",
        "2099-01-01T00:00:00Z",
        "2099-01-02T00:00:00Z",
        1,
        20,
        "maintenance-action-2",
    )
    direct_vm.sender = direct_bob
    vault.accept_commitment("commitment-release-2")
    direct_vm.warp("2100-01-01T00:00:00Z")
    vault.release_undisputed_commitment("commitment-release-2")
    assert vault.get_balance_breakdown(as_address(direct_alice))["locked_exposure"] == 0


def test_withdrawal_cannot_spend_locked_exposure(vault_contract, direct_vm, direct_alice, direct_bob):
    vault = vault_contract
    _fund_operator(vault, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    vault.create_commitment(
        "commitment-withdraw",
        as_address(direct_bob),
        "Keeper maintenance",
        "scheduled-trigger",
        "2099-01-01T00:00:00Z",
        "2099-01-02T00:00:00Z",
        1,
        75,
        "maintenance-action",
    )
    with direct_vm.expect_revert("available withdrawal exceeds balance"):
        vault.withdraw_available(26)
    vault.withdraw_available(25)
    assert vault.get_balance_breakdown(as_address(direct_alice))["locked_exposure"] == 75


def test_vault_statistics_track_application_layer_totals(vault_contract, direct_vm, direct_alice, direct_bob):
    vault = vault_contract
    _fund_operator(vault, direct_vm, direct_alice, amount=100)
    direct_vm.sender = direct_alice
    vault.create_commitment(
        "commitment-statistics",
        as_address(direct_bob),
        "Keeper maintenance",
        "scheduled-trigger",
        "2099-01-01T00:00:00Z",
        "2099-01-02T00:00:00Z",
        1,
        20,
        "maintenance-action",
    )
    statistics = vault.get_vault_statistics()
    assert statistics["total_operators"] == 1
    assert statistics["total_bond"] == 100
    assert statistics["available_bond"] == 80
    assert statistics["locked_exposure"] == 20
