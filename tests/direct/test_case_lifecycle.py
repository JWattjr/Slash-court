import json

from tests.direct.conftest import RULEBOOK_TEXT


def test_case_policy_primitives_reject_unknown_rule_ids(court_contract, direct_vm, direct_owner):
    court = court_contract
    direct_vm.sender = direct_owner
    court.create_initial_rulebook(RULEBOOK_TEXT, "sha256:rulebook")
    with direct_vm.expect_revert("unknown or duplicate alleged rule ids"):
        court._validate_rule_ids(["R999"], "alleged rule ids")
    with direct_vm.expect_revert("unknown or duplicate alleged rule ids"):
        court._validate_rule_ids(["R3", "R3"], "alleged rule ids")
    assert court._validate_rule_ids(json.loads('["R3", "R4"]'), "alleged rule ids") == ["R3", "R4"]
