# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""Permissionless synchronization of finalized Pipeline Court history."""
import json
import re
from genlayer import *


class OperatorRecord(gl.Contract):
    governor: Address
    charter: Address
    court: Address
    bound: bool
    operators: TreeMap[str, str]
    recorded: TreeMap[str, bool]

    def __init__(self):
        if int(gl.message.chain_id) != 61999 or gl.message.value:
            raise gl.vm.UserError("[EXPECTED] StudioNet only; no value")
        self.governor = gl.message.sender_address
        self.bound = False

    @gl.public.write
    def bind(self, charter: str, court: str) -> None:
        if gl.message.sender_address != self.governor or self.bound or gl.message.value:
            raise gl.vm.UserError("[EXPECTED] one-time governor binding")
        self.charter, self.court = Address(charter), Address(court)
        if (any(re.fullmatch(r"0x[0-9a-fA-F]{40}", a) is None or int(a, 16) == 0 for a in (charter, court))
                or self.charter == self.court or gl.message.contract_address in (self.charter, self.court)):
            raise gl.vm.UserError("[EXPECTED] distinct contracts required")
        self.bound = True

    @gl.public.write
    def sync(self, job_id: str) -> None:
        if not self.bound or gl.message.value or self.recorded.get(job_id, False):
            raise gl.vm.UserError("[EXPECTED] bound record; one update; no value")
        job = json.loads(gl.get_contract_at(self.charter).view().get_job(job_id))
        if job.get("status") != "FINAL":
            raise gl.vm.UserError("[EXPECTED] finalized settlement required")
        void = job["outcome"].startswith("VOID")
        case = {} if void else json.loads(gl.get_contract_at(self.court).view().get_case(job_id))
        if not void and (not case.get("finalized") or case.get("charter_digest") != job["digest"]):
            raise gl.vm.UserError("[EXPECTED] finalized bound assessment required")
        for i, step in enumerate(job["steps"]):
            profile = self._profile(step["operator"])
            profile["cases"] += 1
            profile["voids"] += int(void)
            profile["violations"] += int(not void and i == job["liable_index"])
            profile["faithful_steps"] += int(not void and case["assessment"]["steps"][i]["effective_verdict"] == "FAITHFUL")
            profile["bond_multiplier"] = 1 if profile["violations"] == 0 else 2 if profile["violations"] == 1 else 4
            profile["job_ids"].append(job_id)
            profile["job_ids"] = profile["job_ids"][-20:]
            self.operators[step["operator"]] = json.dumps(profile, sort_keys=True)
        self.recorded[job_id] = True

    def _profile(self, operator: str) -> dict:
        return json.loads(self.operators.get(operator.lower(), "")) if self.operators.get(operator.lower(), "") else {
            "operator": operator.lower(), "cases": 0, "violations": 0,
            "faithful_steps": 0, "voids": 0, "bond_multiplier": 1, "job_ids": []}

    @gl.public.view
    def get_operator(self, operator: str) -> str:
        return json.dumps(self._profile(str(Address(operator)).lower()), sort_keys=True)

    @gl.public.view
    def has_record(self, job_id: str) -> bool:
        return self.recorded.get(job_id, False)

    @gl.public.view
    def get_bindings(self) -> dict:
        return {"bound": self.bound, "charter": self.charter.as_hex if self.bound else "",
                "court": self.court.as_hex if self.bound else ""}
