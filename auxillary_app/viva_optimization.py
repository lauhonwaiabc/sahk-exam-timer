from ortools.sat.python import cp_model
import pandas as pd
import json

# Parameters
S = 10  # Number of timeslots (sessions)
T = 10  # Number of tables
C = 15  # Number of candidates

# Candidate priority list with actual candidate numbers (IDs)
candidate_priority = [
    "05","06","12","15","17","18","22","25","31","01","04","10","08","13","26"
]

assert T >= S, "T must be greater or equal to S"
assert 2 * T >= C >= T, "C must be between T and 2T"
assert len(candidate_priority) == C, "Priority list length must match C"

# Mapping between index (0-based) and actual candidate number (string)
candidate_num_map = [str(cid) for cid in candidate_priority]

# CP-SAT model
model = cp_model.CpModel()

# Variables: indexed by (timeslot, table, candidate_index)
is_hotseat = {}
is_observer = {}

for s in range(S):
    for t in range(T):
        for c in range(C):
            is_hotseat[(s, t, c)] = model.NewBoolVar(f'hotseat_s{s}_t{t}_c{c}')
            is_observer[(s, t, c)] = model.NewBoolVar(f'observer_s{s}_t{t}_c{c}')

# Hard rule 1: Each grid (timeslot-table) exactly 1 hotseat, at most 1 observer, no overlap
for s in range(S):
    for t in range(T):
        model.AddExactlyOne([is_hotseat[(s, t, c)] for c in range(C)])
        model.AddAtMostOne([is_observer[(s, t, c)] for c in range(C)])
        for c in range(C):
            model.AddBoolOr([is_hotseat[(s, t, c)].Not(), is_observer[(s, t, c)].Not()])

# Hard rule 2: Each candidate assigned exactly once per timeslot as hotseat or observer
for s in range(S):
    for c in range(C):
        assigned_vars = []
        for t in range(T):
            assigned_vars.append(is_hotseat[(s, t, c)])
            assigned_vars.append(is_observer[(s, t, c)])
        model.AddExactlyOne(assigned_vars)

# Hard rule 3: No candidate visits the same table twice in any role
for c in range(C):
    for t in range(T):
        visits = []
        for s in range(S):
            visits.append(is_hotseat[(s, t, c)])
            visits.append(is_observer[(s, t, c)])
        model.AddAtMostOne(visits)

# Hard rule 4: Hotseat evenly distributed among candidates
min_hotseat = (S * T) // C
max_hotseat = min_hotseat + 1
for c in range(C):
    hotseat_count = []
    for s in range(S):
        for t in range(T):
            hotseat_count.append(is_hotseat[(s, t, c)])
    model.Add(sum(hotseat_count) >= min_hotseat)
    model.Add(sum(hotseat_count) <= max_hotseat)

# Hard rule 5: Hotseat assignments non-increasing by priority order (indices 0..C-1 in priority)
for i in range(C - 1):
    c1 = i
    c2 = i + 1
    sum_c1 = sum(is_hotseat[(s, t, c1)] for s in range(S) for t in range(T))
    sum_c2 = sum(is_hotseat[(s, t, c2)] for s in range(S) for t in range(T))
    model.Add(sum_c1 >= sum_c2)

# Solve
solver = cp_model.CpSolver()
status = solver.Solve(model)

if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
    # Prepare candidate_1.csv (table centric)
    candidate_1_cols = ["", ""] + [f"session_{s+1}" for s in range(S)]
    candidate_1_rows = []
    for t in range(T):
        candidate_row = [f"table_{t+1}", "candidate"]
        observer_row = [f"table_{t+1}", "observer"]
        for s in range(S):
            hot_c = None
            obs_c = None
            for c in range(C):
                if solver.BooleanValue(is_hotseat[(s, t, c)]):
                    hot_c = c
                if solver.BooleanValue(is_observer[(s, t, c)]):
                    obs_c = c
            candidate_row.append(candidate_num_map[hot_c] if hot_c is not None else "")
            observer_row.append(candidate_num_map[obs_c] if obs_c is not None else "")
        candidate_1_rows.append(candidate_row)
        candidate_1_rows.append(observer_row)
    df_candidate_1 = pd.DataFrame(candidate_1_rows, columns=candidate_1_cols)

    # Prepare candidate_2.csv (session centric)
    candidate_2_cols = ["", ""] + [f"table_{t+1}" for t in range(T)]
    candidate_2_rows = []
    for s in range(S):
        candidate_row = [f"session_{s+1}", "candidate"]
        observer_row = [f"session_{s+1}", "observer"]
        for t in range(T):
            hot_c = None
            obs_c = None
            for c in range(C):
                if solver.BooleanValue(is_hotseat[(s, t, c)]):
                    hot_c = c
                if solver.BooleanValue(is_observer[(s, t, c)]):
                    obs_c = c
            candidate_row.append(candidate_num_map[hot_c] if hot_c is not None else "")
            observer_row.append(candidate_num_map[obs_c] if obs_c is not None else "")
        candidate_2_rows.append(candidate_row)
        candidate_2_rows.append(observer_row)
    df_candidate_2 = pd.DataFrame(candidate_2_rows, columns=candidate_2_cols)

    # Save CSV files
    df_candidate_1.to_csv("viva_am_candidate_1.csv", index=False)
    df_candidate_2.to_csv("viva_am_candidate_2.csv", index=False)
    print("CSV files saved: viva_am_candidate_1.csv, viva_am_candidate_2.csv")

    # Generate vivaData JSON (sessions with candidate and observer lists)
    vivaData = {}
    for s in range(S):
        session_key = f"Session {s+1}"
        vivaData[session_key] = {"Candidate": [], "Observer": []}
        for t in range(T):
            cand_num = None
            obs_num = None
            for c in range(C):
                if solver.BooleanValue(is_hotseat[(s, t, c)]):
                    cand_num = c
                if solver.BooleanValue(is_observer[(s, t, c)]):
                    obs_num = c
            vivaData[session_key]["Candidate"].append(candidate_num_map[cand_num] if cand_num is not None else None)
            vivaData[session_key]["Observer"].append(candidate_num_map[obs_num] if obs_num is not None else None)

    # Save JSON with arrays on single lines (compact inside arrays)
    import re
    json_str = json.dumps(vivaData, indent=4)

    def collapse_arrays(match):
        return match.group(0).replace('\n', '').replace(' ', '')

    pattern = re.compile(r'\[[^\[\]]*\]')
    json_str_single_line_arrays = pattern.sub(collapse_arrays, json_str)
    js_output = "const vivaData = " + json_str_single_line_arrays + ";"

    with open("viva_am_data.js", "w") as f_js:
        f_js.write(js_output)

    print("JS file saved: viva_am_data.js")
else:
    print("No solution found.")
