import json
import hashlib

from tests.direct.conftest import RULEBOOK_TEXT


def test_rulebook_versions_are_append_only_and_penalties_are_pinned(
    court_contract, direct_vm, direct_owner, direct_alice
):
    court = court_contract
    direct_vm.sender = direct_owner
    version_one_hash = "sha256:" + hashlib.sha256(RULEBOOK_TEXT.encode("utf-8")).hexdigest()
    version_two_text = RULEBOOK_TEXT + "\nR7 — PROPORTIONALITY: use the fixed commitment mapping."
    version_two_hash = "sha256:" + hashlib.sha256(version_two_text.encode("utf-8")).hexdigest()
    court.create_initial_rulebook(RULEBOOK_TEXT, version_one_hash)
    version_one = court.get_rulebook(1)
    assert version_one["version"] == 1
    assert version_one["full_slash_bps"] == 10_000
    assert version_one["partial_slash_bps"] == 5_000
    assert version_one["beneficiary_share_bps"] == 8_000
    assert version_one["safety_pool_share_bps"] == 2_000

    court.publish_rulebook_version(
        version_two_text,
        version_two_hash,
    )
    assert court.get_current_rulebook()["version"] == 2
    assert court.get_rulebook(1)["rulebook_hash"] == version_one_hash
    assert court.get_rulebook(2)["rulebook_hash"] == version_two_hash
    assert court.get_rulebook_versions(0, 10)["total"] == 2

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("governor authorization required"):
        court.publish_rulebook_version(RULEBOOK_TEXT, version_one_hash)


def test_evidence_domain_policy_is_canonicalized(court_contract, direct_vm, direct_owner):
    court = court_contract
    direct_vm.sender = direct_owner
    court.configure_approved_evidence_domains(
        json.dumps(["Status.Example.Org", "evidence.example.com"])
    )
    domains = court.get_approved_evidence_domains()
    assert domains["domains"] == ["status.example.org", "evidence.example.com"]
    assert domains["total"] == 2
