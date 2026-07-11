import csv
import json
import re
import os

def pad(val):
    """Zero-pad single-digit numbers to two digits."""
    if val and val.isdigit() and len(val) == 1:
        return "0" + val
    return val

def parse_section(rows, num_stations=15, num_sessions=15):
    """Parse a section of station-centric rows into session-centric data."""
    data = {}
    for s in range(num_sessions):
        data[f"Session {s+1}"] = {"Candidate": [], "Observer": []}

    for st in range(num_stations):
        cand_row = rows[st * 2 + 1]      # candidate row (skip header)
        obs_row = rows[st * 2 + 2]       # observer row
        # Columns: [station_label, description, s1, s2, ..., s15]
        for s in range(num_sessions):
            col_idx = s + 2  # skip first 2 columns
            cand_val = pad(cand_row[col_idx].strip()) if col_idx < len(cand_row) and cand_row[col_idx].strip() else ""
            obs_val = pad(obs_row[col_idx].strip()) if col_idx < len(obs_row) and obs_row[col_idx].strip() else ""
            data[f"Session {s+1}"]["Candidate"].append(cand_val if cand_val else None)
            data[f"Session {s+1}"]["Observer"].append(obs_val if obs_val else None)

    return data

def export_js(data, filename, var_name="osceData"):
    json_str = json.dumps(data, indent=2)

    def collapse_arrays(match):
        return match.group(0).replace('\n', '').replace(' ', '')

    pattern = re.compile(r'\[[^\[\]]*\]')
    json_str = pattern.sub(collapse_arrays, json_str)

    with open(filename, "w") as f:
        f.write("'use strict';\n")
        f.write(f"const {var_name} = {json_str};\n")
    print(f"Saved: {filename}")


# Read the CSV
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "..", "osce.csv")
config_dir = os.path.join(script_dir, "..", "sahk-exam-timer-main", "config")

with open(csv_path, "r", encoding="utf-8-sig") as f:
    reader = csv.reader(f)
    all_rows = list(reader)

# AM section: rows 1-31 (index 1 = AM header with times, indices 2-31 = station data)
# Header row is at index 1
am_start = 1  # header row (skip row 0 which is the session name header)
am_stations = 15
am_sessions = 15

# Each station is 2 rows (candidate + observer)
# rows 2 to 31 inclusive = 30 rows = 15 stations * 2 rows
am_section_rows = all_rows[am_start:am_start + 1 + am_stations * 2]  # include header

# PM section starts after AM + blank rows
# AM ends at row 32 (index 31), then 2 blank rows (32,33), then PM header at row 34 (index 33)
pm_start = 34  # index of PM header row

pm_section_rows = all_rows[pm_start:pm_start + 1 + am_stations * 2]

am_data = parse_section(am_section_rows, am_stations, am_sessions)
pm_data = parse_section(pm_section_rows, am_stations, am_sessions)

export_js(am_data, os.path.join(config_dir, "osce_data_am.js"))
export_js(pm_data, os.path.join(config_dir, "osce_data_pm.js"))
