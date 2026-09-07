from tests.direct.test_resolution_application import _prepare_vault, _resolution_provenance
from tests.direct.conftest import as_address


def test_available_and_award_withdrawals_are_separate_and_single_spend(
    vault_contract, direct_vm, direct_owner, direct_alice, direct_bob, direct_charlie
):
    vault = vault_contract
    case_id, commitment_id = _prepare_vault(
        vault, direct_vm, direct_owner, direct_alice, direct_bob, direct_charlie, 20
    )
    vault.apply_resolution(
        case_id, commitment_id, "PROVABLE_MISCONDUCT", 10_000, as_address(direct_bob),
        *_resolution_provenance(vault, commitment_id, "PROVABLE_MISCONDUCT")
    )
    direct_vm.sender = direct_alice
    vault.withdraw_available(80)
    with direct_vm.expect_revert("available withdrawal exceeds balance"):
        vault.withdraw_available(1)
    direct_vm.sender = direct_bob
    vault.withdraw_award(16)
    with direct_vm.expect_revert("award withdrawal exceeds balance"):
        vault.withdraw_award(1)
