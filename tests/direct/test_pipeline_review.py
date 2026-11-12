"""Remaining predecessor adversarial matrix, adapted to native multi-contract custody."""
import base64
import copy
import hashlib
import json
import itertools
from types import SimpleNamespace
import pytest
from tests.direct.test_pipeline import deploy_pipeline, active_job, mock_assessment, warp, NOW, OP, CLAIMANT, ROOT, BODY, SHA


LEAVES = [("schema_version",), ("snapshot_digest",)] + [
    ("steps", i, field) for i in range(3) for field in
    ("step_id", "index", "operator", "recorded", "evidence_status", "semantic_verdict", "effective_verdict", "basis", "quote")
] + [("steps", i, side, field) for i in range(3) for side in ("input", "output") for field in
     ("url", "committed_digest", "status", "http_status", "reason_code", "byte_length", "observed_digest")]


@pytest.mark.parametrize("path", LEAVES)
def test_every_consensus_leaf_bound(deploy_pipeline, direct_vm, path):
    court, mod, source, calls = deploy_pipeline("court")
    mock_assessment(direct_vm, ("FAITHFUL", "VIOLATION", "FAITHFUL"))
    court.adjudicate("job")
    candidate = json.loads(court.get_case("job"))["assessment"]
    assert direct_vm.run_validator(leader_result=candidate)
    forged = copy.deepcopy(candidate)
    target = forged
    for key in path[:-1]: target = target[key]
    key, value = path[-1], target[path[-1]]
    target[key] = not value if type(value) is bool else value + 1 if type(value) is int else "forged"
    assert direct_vm.run_validator(leader_result=forged) is False
    assert json.loads(court.get_case("job"))["assessment"] == candidate


@pytest.mark.parametrize("kind", ["removed", "reordered", "extra", "foreign_snapshot", "error", "changed_fetch"])
def test_envelope_forgery_and_independent_fetch(deploy_pipeline, direct_vm, kind):
    court, mod, source, calls = deploy_pipeline("court")
    mock_assessment(direct_vm, ("FAITHFUL", "VIOLATION", "FAITHFUL"))
    court.adjudicate("job")
    before = court.get_case("job")
    forged = json.loads(before)["assessment"]
    if kind == "removed": forged["steps"].pop()
    if kind == "reordered": forged["steps"].reverse()
    if kind == "extra": forged["amount"] = 100
    if kind == "foreign_snapshot": forged["snapshot_digest"] = "0" * 64
    if kind == "error":
        assert not direct_vm.run_validator(leader_error=RuntimeError("leader failed"))
    else:
        if kind == "changed_fetch":
            direct_vm.clear_mocks()
            direct_vm.mock_web(r".*", {"status": 404, "body": b"offline"})
        assert not direct_vm.run_validator(leader_result=forged)
    assert court.get_case("job") == before


@pytest.mark.parametrize("raw", [{}, {"verdict": "FAITHFUL"}, {"verdict": "BOGUS", "quote": "Complete log."},
    {"verdict": "FAITHFUL", "quote": "invented"}, {"verdict": "FAITHFUL", "quote": ""},
    {"verdict": "FAITHFUL", "quote": "Complete log.", "amount": 100}, [], "broken"])
def test_model_failure_never_turns_into_a_verdict(deploy_pipeline, direct_vm, monkeypatch, raw):
    court, mod, source, calls = deploy_pipeline("court")
    mock_assessment(direct_vm, ("FAITHFUL",) * 3)
    monkeypatch.setattr(mod.gl.nondet, "exec_prompt", lambda *a, **k: raw)
    with direct_vm.expect_revert("invalid local assessment"):
        court.adjudicate("job")
    assert court.get_case("job") == "{}"


@pytest.mark.parametrize("body,status,reason", [(b"",200,"EMPTY"),(b" ",200,"EMPTY_TEXT"),
    (b"x" * 15001,200,"OVERSIZED"),(b"\xff",200,"INVALID_UTF8"),
    (b"missing",404,"HTTP_STATUS"),(b"limited",429,"HTTP_STATUS"),(b"down",503,"HTTP_STATUS"),
    (b"partial",206,"HTTP_STATUS"),(b"redirect",302,"HTTP_STATUS")])
def test_full_evidence_eligibility_matrix(deploy_pipeline, direct_vm, monkeypatch, body, status, reason):
    court, mod, source, calls = deploy_pipeline("court")
    mock_assessment(direct_vm, ("FAITHFUL", "VIOLATION", "FAITHFUL"))
    original = mod.gl.nondet.web.get
    monkeypatch.setattr(mod.gl.nondet.web, "get", lambda url: SimpleNamespace(status=status, body=body) if url == ROOT + "A-input.txt" else original(url))
    assert court.adjudicate("job") == "UNATTRIBUTABLE"
    row = json.loads(court.get_case("job"))["assessment"]["steps"][0]
    assert row["input"]["reason_code"] == reason and row["effective_verdict"] == "UNCLEAR"


@pytest.mark.parametrize("kind", ["tampered", "transport", "body_type", "boundary"])
def test_observation_integrity_and_transport(deploy_pipeline, direct_vm, monkeypatch, kind):
    court, mod, source, calls = deploy_pipeline("court")
    mock_assessment(direct_vm, ("FAITHFUL", "VIOLATION", "FAITHFUL"))
    original = mod.gl.nondet.web.get
    def fetch(url):
        if url != ROOT + "A-input.txt": return original(url)
        if kind == "transport": raise RuntimeError("offline")
        body = "bad" if kind == "body_type" else b"x" * 15000 if kind == "boundary" else b"edited log"
        return SimpleNamespace(status=200, body=body)
    monkeypatch.setattr(mod.gl.nondet.web, "get", fetch)
    if kind == "boundary":
        source["job"]["records"]["A"]["input_digest"] = hashlib.sha256(b"x" * 15000).hexdigest()
    result = court.adjudicate("job")
    row = json.loads(court.get_case("job"))["assessment"]["steps"][0]
    assert row["input"]["status"] == ("AVAILABLE" if kind == "boundary" else "TAMPERED" if kind == "tampered" else "UNAVAILABLE")
    assert result == ("PIPELINE_FAULT" if kind == "boundary" else "UNATTRIBUTABLE")


@pytest.mark.parametrize("count", [2,5])
def test_minimum_maximum_steps(deploy_pipeline, direct_vm, count):
    court, mod, source, calls = deploy_pipeline("court")
    source["job"]["steps"] = [{"step_id": str(i), "operator": "0x" + str(i + 1) * 40, "duty": "copy", "bond_units": 1} for i in range(count)]
    source["job"]["records"] = {}
    assert court.adjudicate("job") == "UNATTRIBUTABLE"
    assert len(json.loads(court.get_case("job"))["assessment"]["steps"]) == count


@pytest.mark.parametrize("offset", [-1,0,1])
def test_recording_boundary_authorization_and_replay(deploy_pipeline, direct_vm, offset):
    charter, mod, source, calls = deploy_pipeline("charter")
    source["job"]["status"] = "ACTIVE"
    source["job"]["records"] = {}
    charter.jobs["job"] = json.dumps(source["job"])
    direct_vm.sender = mod.Address(OP[0])
    warp(direct_vm, NOW + 200 + offset)
    args = ("job", "A", ROOT + "input", ROOT + "output", SHA, SHA)
    if offset >= 0:
        with direct_vm.expect_revert("recording closed"): charter.record_step(*args)
    else:
        with direct_vm.prank(mod.Address(CLAIMANT)), direct_vm.expect_revert("assigned operator"):
            charter.record_step(*args)
        charter.record_step(*args)
        with direct_vm.expect_revert("immutable record"): charter.record_step(*args)


@pytest.mark.parametrize("stage", ["FUNDING", "ACTIVE", "DISPUTED"])
def test_timeout_is_permissionless_no_web_no_default_fault(deploy_pipeline, direct_vm, monkeypatch, stage):
    charter, mod, source, calls = deploy_pipeline("charter")
    charter.bind(OP[0], OP[1])
    job = source["job"]
    job["status"] = stage
    if stage == "FUNDING": job.update(deposits={OP[0]: 10}, incident=None, filing_paid=0)
    if stage == "ACTIVE": job.update(incident=None, filing_paid=0)
    charter.jobs["job"] = json.dumps(job)
    monkeypatch.setattr(mod.gl, "get_contract_at", lambda *a: (_ for _ in ()).throw(RuntimeError("unavailable court")))
    # Timeout never needs nondeterministic evidence; only emission needs a stub.
    class Stub:
        def view(self): raise RuntimeError("court unavailable")
        def emit(self, **kw): return self
        def finalize_settlement(self, *a): pass
    monkeypatch.setattr(mod.gl, "get_contract_at", lambda *a: Stub())
    warp(direct_vm, NOW + (100 if stage == "FUNDING" else 300))
    assert charter.settle("job") == "VOID_TIMEOUT"
    settled = json.loads(charter.get_job("job"))
    assert settled["credits"] == {**job["deposits"], **({CLAIMANT: 3} if stage == "DISPUTED" else {})}


def ready_claim(deploy, vm, monkeypatch, rejected=False):
    charter, mod, source, calls = deploy("charter")
    job = source["job"]
    job.update(status="FINAL", credits={**dict.fromkeys(OP,10), CLAIMANT:3})
    charter.jobs["job"] = json.dumps(job)
    charter.total_received = 33
    vm.deal(mod.gl.message.contract_address, 33)
    transfers = []
    monkeypatch.setattr(mod, "Recipient", lambda address: SimpleNamespace(emit_transfer=lambda **kw: transfers.append((str(address).lower(), kw))))
    if rejected:
        charter.rejected_credit[OP[0]] = 10
    return charter, mod, transfers


def test_claim_permissionless_reserved_before_emission_and_duplicate_rejected(deploy_pipeline, direct_vm, monkeypatch):
    charter, mod, transfers = ready_claim(deploy_pipeline, direct_vm, monkeypatch)
    charter.claim("job", OP[0], 1)
    assert len(transfers) == 1 and transfers[0][0] == OP[0]
    assert json.loads(charter.get_job("job"))["claims"][OP[0]]["status"] == "pending"
    with direct_vm.expect_revert("already pending"): charter.claim("job", OP[0], 2)


@pytest.mark.parametrize("status", ["paid_pending_finality", "failed_pending_finality"])
def test_claim_finality_once_and_retry_attempt(deploy_pipeline, direct_vm, monkeypatch, status):
    charter, mod, transfers = ready_claim(deploy_pipeline, direct_vm, monkeypatch)
    charter.claim("job", OP[0], 1)
    job = json.loads(charter.get_job("job"))
    job["claims"][OP[0]]["status"] = status
    charter.jobs["job"] = json.dumps(job)
    with direct_vm.expect_revert("self finality"): charter.finalize_claim("job", OP[0], 1)
    with direct_vm.prank(mod.gl.message.contract_address):
        charter.finalize_claim("job", OP[0], 0)
        assert int(charter.total_paid) == 0
        charter.finalize_claim("job", OP[0], 1)
        charter.finalize_claim("job", OP[0], 1)
    assert int(charter.total_paid) == (10 if status.startswith("paid") else 0)
    if status.startswith("failed"):
        with direct_vm.expect_revert("attempt"): charter.claim("job", OP[0], 1)
        charter.claim("job", OP[0], 2)


def test_rejected_value_nonce_and_future_deposits(deploy_pipeline, direct_vm, monkeypatch):
    charter, mod, transfers = ready_claim(deploy_pipeline, direct_vm, monkeypatch, rejected=True)
    charter.claim("__rejected__", OP[0], 1)
    claims = json.loads(charter.rejected_claims[OP[0]])
    claims[OP[0]]["status"] = "paid_pending_finality"
    charter.rejected_claims[OP[0]] = json.dumps(claims)
    with direct_vm.prank(mod.gl.message.contract_address): charter.finalize_claim("__rejected__", OP[0], 1)
    charter.rejected_credit[OP[0]] = 10
    with direct_vm.expect_revert("attempt"): charter.claim("__rejected__", OP[0], 1)
    charter.claim("__rejected__", OP[0], 2)


@pytest.mark.parametrize("bad", ["ACCEPTED", "wrong_contract", "wrong_action", "wrong_job", "error"])
def test_recovery_requires_exact_finalized_source(deploy_pipeline, direct_vm, monkeypatch, bad):
    charter, mod, source, calls = deploy_pipeline("charter")
    job = source["job"]
    job["status"] = "COMPILED_PENDING"
    job["rejection_reasons"] = []
    charter.jobs["job"] = json.dumps(job)
    tx = {"status":"FINALIZED", "result":6, "to_address":str(mod.gl.message.contract_address),
          "consensus_data":{"leader_receipt":[{"execution_result":"SUCCESS"}]},
          "data":{"calldata":base64.b64encode(mod.calldata.encode({"method":"compile", "args":["job"]})).decode()}}
    if bad == "ACCEPTED": tx["status"] = "ACCEPTED"
    if bad == "wrong_contract": tx["to_address"] = OP[2]
    if bad == "error": tx["consensus_data"]["leader_receipt"][0]["execution_result"] = "ERROR"
    if bad in ("wrong_action", "wrong_job"):
        call = {"method": "claim" if bad == "wrong_action" else "compile", "args":["different" if bad == "wrong_job" else "job"]}
        tx["data"]["calldata"] = base64.b64encode(mod.calldata.encode(call)).decode()
    monkeypatch.setattr(mod, "protocol_receipt", lambda h: tx)
    with direct_vm.expect_revert(): charter.recover_finality("job", "0x" + "a" * 64)
    assert json.loads(charter.get_job("job"))["status"] == "COMPILED_PENDING"


def test_record_growth_bounded_and_void_no_court_dependency(deploy_pipeline, direct_vm):
    record, mod, source, calls = deploy_pipeline("record")
    record.bind(OP[0], OP[1])
    source["job"].update(status="FINAL",outcome="VOID_TIMEOUT",liable_index=None)
    for i in range(25): record.sync("job-" + str(i))
    profile = json.loads(record.get_operator(OP[0]))
    assert profile["cases"] == profile["voids"] == 25 and profile["violations"] == 0
    assert len(profile["job_ids"]) == 20 and record.has_record("job-0")


@pytest.mark.parametrize("credit", [True, False])
def test_actual_verify_claim_then_finality(deploy_pipeline, direct_vm, monkeypatch, credit):
    charter, mod, transfers = ready_claim(deploy_pipeline, direct_vm, monkeypatch)
    requester = str(mod.gl.message.sender_address).lower()
    contract = str(mod.gl.message.contract_address).lower()
    charter.claim("job", OP[0], 1)
    parent_hash, child_hash = "0x" + "a" * 64, "0x" + "b" * 64
    parent = {"hash":parent_hash,"status":"FINALIZED","result":6,"from_address":requester,"to_address":contract,
              "consensus_data":{"leader_receipt":[{"execution_result":"SUCCESS"}]},
              "data":{"calldata":base64.b64encode(mod.calldata.encode({"method":"claim","args":["job",OP[0],1]})).decode()},
              "triggered_transactions":[child_hash]}
    child = {"hash":child_hash,"status":"FINALIZED","type":0,"from_address":contract,"to_address":OP[0],
             "value":"10","consensus_data":None,"triggered_on":"finalized","value_credited":credit}
    monkeypatch.setattr(mod,"protocol_receipt",lambda h: parent if h == parent_hash else child)
    expected = "paid" if credit else "failed"
    assert charter.verify_claim("job",OP[0],parent_hash) == expected + "_pending_finality"
    assert int(charter.total_paid) == 0
    with direct_vm.prank(mod.gl.message.contract_address):
        charter.finalize_claim("job",OP[0],1)
        charter.finalize_claim("job",OP[0],1)
    assert int(charter.total_paid) == (10 if credit else 0)
    assert json.loads(charter.get_job("job"))["claims"][OP[0]]["status"] == expected


@pytest.mark.parametrize("method", ["compile", "settle", "deposit"])
def test_successful_receipt_recovery_is_idempotent(deploy_pipeline, direct_vm, monkeypatch, method):
    charter, mod, source, calls = deploy_pipeline("charter")
    charter.bind(OP[0],OP[1])
    job=source["job"]
    job.update(status="COMPILED_PENDING" if method=="compile" else "SETTLING" if method=="settle" else "FUNDING",
               rejection_reasons=[],credits={**dict.fromkeys(OP,10),CLAIMANT:3})
    charter.jobs["job"]=json.dumps(job)
    tx={"status":"FINALIZED","result":6,"from_address":OP[0],"value":10,"to_address":str(mod.gl.message.contract_address),
        "consensus_data":{"leader_receipt":[{"execution_result":"SUCCESS"}]},
        "data":{"calldata":base64.b64encode(mod.calldata.encode({"method":method,"args":["job"]})).decode()}}
    monkeypatch.setattr(mod,"protocol_receipt",lambda h:tx)
    charter.recover_finality("job","0x"+"a"*64)
    before=charter.get_job("job")
    charter.recover_finality("job","0x"+"a"*64)
    assert charter.get_job("job")==before
