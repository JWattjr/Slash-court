from tests.direct.conftest import as_address


def _prepare_vault(vault, direct_vm, direct_owner, direct_alice, direct_bob, direct_charlie, exposure):
    direct_vm.sender = direct_owner
    vault.configure_court(as_address(direct_charlie))
    direct_vm.sender = direct_alice
    vault.register_operator("https://evidence.example.com/operators/keeper-a.json")
    direct_vm.value = 100
    vault.deposit_bond()
    direct_vm.value = 0
    vault.create_commitment(
        "commitment-resolution-" + str(exposure),
        as_address(direct_bob),
        "Keeper maintenance",
        "scheduled-trigger",
        "2099-01-01T00:00:00Z",
        "2099-01-02T00:00:00Z",
        1,
        exposure,
        "maintenance-action",
    )
    direct_vm.sender = direct_bob
    vault.accept_commitment("commitment-resolution-" + str(exposure))
    direct_vm.sender = direct_charlie
    vault.bind_case(
        "case-resolution-" + str(exposure),
        "commitment-resolution-" + str(exposure),
        "2025-01-01T00:00:00Z",
    )
    return "case-resolution-" + str(exposure), "commitment-resolution-" + str(exposure)


def test_full_resolution_is_capped_and_allocated(vault_contract, direct_vm, direct_owner, direct_alice, direct_bob, direct_charlie):
    vault = vault_contract
    case_id, commitment_id = _prepare_vault(
        vault, direct_vm, direct_owner, direct_alice, direct_bob, direct_charlie, 20
    )
    vault.apply_resolution(
        case_id, commitment_id, "PROVABLE_MISCONDUCT", 10_000, as_address(direct_bob)
    )
    operator = vault.get_balance_breakdown(as_address(direct_alice))
    beneficiary = vault.get_operator(as_address(direct_bob))
    assert operator["total_bond"] == 80
    # Only the committed exposure is slashable; the uncommitted remainder
    # stays withdrawable after settlement.
    assert operator["available_bond"] == 80
    assert operator["locked_exposure"] == 0
    assert beneficiary["claimable_awards"] == 16
    assert operator["safety_pool_balance"] == 4
    assert vault.get_case_application(case_id)["penalty_amount"] == 20
    statistics = vault.get_vault_statistics()
    assert statistics["total_bond"] == 80
    assert statistics["available_bond"] == 80
    assert statistics["locked_exposure"] == 0
    assert statistics["total_penalties_applied"] == 20

    # Exact replay is a no-op for balances and remains safe to retry.
    vault.apply_resolution(
        case_id, commitment_id, "PROVABLE_MISCONDUCT", 10_000, as_address(direct_bob)
    )
    assert vault.get_balance_breakdown(as_address(direct_alice))["total_bond"] == 80


def test_partial_and_no_slash_mapping_never_overallocates(vault_contract, direct_vm, direct_owner, direct_alice, direct_bob, direct_charlie):
    vault = vault_contract
    case_id, commitment_id = _prepare_vault(
        vault, direct_vm, direct_owner, direct_alice, direct_bob, direct_charlie, 3
    )
    vault.apply_resolution(
        case_id, commitment_id, "NEGLIGENT_FAILURE", 5_000, as_address(direct_bob)
    )
    application = vault.get_case_application(case_id)
    assert application["penalty_amount"] == 1
    assert application["beneficiary_award"] == 0
    assert application["safety_pool_amount"] == 1
    assert application["beneficiary_award"] + application["safety_pool_amount"] == application["penalty_amount"]

    # A second commitment on the same vault demonstrates that the operator's
    # remaining global bond stays intact when the classification is NO_SLASH.
    direct_vm.sender = direct_alice
    no_commitment = "commitment-no-slash"
    vault.create_commitment(
        no_commitment,
        as_address(direct_bob),
        "Keeper maintenance",
        "scheduled-trigger-no-slash",
        "2099-01-01T00:00:00Z",
        "2099-01-02T00:00:00Z",
        1,
        20,
        "maintenance-action-no-slash",
    )
    direct_vm.sender = direct_bob
    vault.accept_commitment(no_commitment)
    direct_vm.sender = direct_charlie
    no_case = "case-no-slash"
    vault.bind_case(no_case, no_commitment, "2025-01-01T00:00:00Z")
    vault.apply_resolution(
        no_case, no_commitment, "EXTERNAL_OUTAGE", 0, as_address(direct_bob)
    )
    assert vault.get_balance_breakdown(as_address(direct_alice))["total_bond"] == 99
    assert vault.get_balance_breakdown(as_address(direct_alice))["available_bond"] == 99


def test_unauthorized_or_arbitrary_penalty_is_rejected(vault_contract, direct_vm, direct_owner, direct_alice, direct_bob, direct_charlie):
    vault = vault_contract
    case_id, commitment_id = _prepare_vault(
        vault, direct_vm, direct_owner, direct_alice, direct_bob, direct_charlie, 20
    )
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("SlashCourt authorization required"):
        vault.apply_resolution(
            case_id, commitment_id, "PROVABLE_MISCONDUCT", 10_000, as_address(direct_bob)
        )
    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("penalty mapping mismatch"):
        vault.apply_resolution(
            case_id, commitment_id, "PROVABLE_MISCONDUCT", 1, as_address(direct_bob)
        )


def test_only_beneficiary_can_withdraw_award(vault_contract, direct_vm, direct_owner, direct_alice, direct_bob, direct_charlie):
    vault = vault_contract
    case_id, commitment_id = _prepare_vault(
        vault, direct_vm, direct_owner, direct_alice, direct_bob, direct_charlie, 20
    )
    vault.apply_resolution(
        case_id, commitment_id, "PROVABLE_MISCONDUCT", 10_000, as_address(direct_bob)
    )
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("award withdrawal exceeds balance"):
        vault.withdraw_award(1)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("award withdrawal exceeds balance"):
        vault.withdraw_award(17)
    vault.withdraw_award(16)
    assert vault.get_operator(as_address(direct_bob))["claimable_awards"] == 0
