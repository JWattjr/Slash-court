import pytest

from .conftest import RULEBOOK_V1, build_protocol


@pytest.mark.integration
def test_deployment_wires_vault_court_rulebook_and_domains():
    protocol = build_protocol()
    vault_config = protocol["vault"].get_vault_configuration(args=[]).call()
    court_stats = protocol["court"].get_statistics(args=[]).call()
    current = protocol["court"].get_current_rulebook(args=[]).call()
    domains = protocol["court"].get_approved_evidence_domains(args=[]).call()
    assert vault_config["slash_court"].lower() == protocol["court"].address.lower()
    assert vault_config["court_configured"] is True
    assert court_stats["current_rulebook_version"] == 1
    assert current["rulebook_text"] == RULEBOOK_V1
    assert set(domains["domains"]) == {"status.example.org", "evidence.example.com"}
