import pandas as pd
import json
import re

def read_candidate_1(filename):
    df = pd.read_csv(filename, dtype=str).fillna("")
    sessions = df.columns[2:].tolist()

    data = {sess: {"Candidate": [], "Observer": []} for sess in sessions}

    for i in range(0, len(df), 2):
        candidate_row = df.iloc[i]
        observer_row = df.iloc[i + 1]
        assert candidate_row[1].lower() == "candidate"
        assert observer_row[1].lower() == "observer"
        for sess in sessions:
            data[sess]["Candidate"].append(candidate_row[sess] if candidate_row[sess] != "" else None)
            data[sess]["Observer"].append(observer_row[sess] if observer_row[sess] != "" else None)

    return data

def read_candidate_2(filename):
    df = pd.read_csv(filename, dtype=str).fillna("")
    stations = df.columns[2:].tolist()

    data = {}
    row = 0
    while row < len(df):
        session_name = df.iloc[row,0]
        candidate_str = df.iloc[row,1].lower()
        assert candidate_str == "candidate"
        observer_str = df.iloc[row+1, 1].lower()
        assert observer_str == "observer"

        candidate_list = [df.iloc[row, col] if df.iloc[row, col] != "" else None for col in range(2, len(df.columns))]
        observer_list = [df.iloc[row+1, col] if df.iloc[row+1, col] != "" else None for col in range(2, len(df.columns))]

        data[session_name] = {
            "Candidate": candidate_list,
            "Observer": observer_list
        }
        row += 2
    return data

def candidate_1_to_candidate_2(data_c1):
    sessions = list(data_c1.keys())
    stations_count = len(next(iter(data_c1.values()))["Candidate"])
    return data_c1

def candidate_2_to_candidate_1(data_c2):
    sessions = list(data_c2.keys())
    stations_count = len(next(iter(data_c2.values()))["Candidate"])
    data_c1 = {}
    for st in range(stations_count):
        data_c1[st] = {"Candidate": [], "Observer": []}

    for session in sessions:
        for st in range(stations_count):
            cand = data_c2[session]["Candidate"][st] if st < len(data_c2[session]["Candidate"]) else None
            obs = data_c2[session]["Observer"][st] if st < len(data_c2[session]["Observer"]) else None
            data_c1[st]["Candidate"].append(cand)
            data_c1[st]["Observer"].append(obs)
    return data_c1, sessions

def export_candidate_1_to_csv(data_c1, sessions, filename):
    cols = ["", ""] + sessions
    rows = []
    for station_idx, v in data_c1.items():
        candidate_row = [f"station_{station_idx+1}", "candidate"] + [x if x is not None else "" for x in v["Candidate"]]
        observer_row = [f"station_{station_idx+1}", "observer"] + [x if x is not None else "" for x in v["Observer"]]
        rows.append(candidate_row)
        rows.append(observer_row)
    df = pd.DataFrame(rows, columns=cols)
    df.to_csv(filename, index=False)

def export_candidate_2_to_csv(data_c2, filename):
    example_session = next(iter(data_c2))
    stations_count = len(data_c2[example_session]["Candidate"])
    cols = ["", ""] + [f"station_{i+1}" for i in range(stations_count)]
    rows = []
    for session, val in data_c2.items():
        candidate_row = [session, "candidate"] + [x if x is not None else "" for x in val["Candidate"]]
        observer_row = [session, "observer"] + [x if x is not None else "" for x in val["Observer"]]
        rows.append(candidate_row)
        rows.append(observer_row)
    df = pd.DataFrame(rows, columns=cols)
    df.to_csv(filename, index=False)

def export_osce_data_js(data_c2, filename):
    json_str = json.dumps(data_c2, indent=4)

    def collapse_arrays(match):
        return match.group(0).replace('\n', '').replace(' ', '')

    pattern = re.compile(r'\[[^\[\]]*\]')
    json_str_single_line_arrays = pattern.sub(collapse_arrays, json_str)

    js_text = f"const osceData = {json_str_single_line_arrays};\n"

    with open(filename, "w") as f:
        f.write(js_text)

    print(f"{filename} saved.")

# --- Main execution example ---

# Read from candidate_1.csv (station centric) and convert to candidate_2 (session centric)
candidate_1_file = "osce_candidate_1.csv"
candidate_2_file = "osce_candidate_2.csv"
osce_js_file = "osce_data.js"

data_c1 = read_candidate_1(candidate_1_file)
data_c2 = candidate_1_to_candidate_2(data_c1)
export_candidate_2_to_csv(data_c2, candidate_2_file)

data_c1_back, sessions = candidate_2_to_candidate_1(data_c2)
export_candidate_1_to_csv(data_c1_back, sessions, candidate_1_file)

export_osce_data_js(data_c2, osce_js_file)
