import json
import sys
import csv
try:
    from ortools.sat.python import cp_model  # type: ignore
except ImportError:
    print("ortools not found. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip",
                          "install", "ortools", "--user"])
    from ortools.sat.python import cp_model  # Import after installation
# from typing import Union
# import os
# from collections import defaultdict

# try:
data = json.loads(sys.argv[1])  # Load input from Node.js
# print(data)
# result = {"status": "success"}  # Sample result
# print(json.dumps(result))  # Return result
# except Exception as e:
#     print(f"Error: {str(e)}", file=sys.stderr)
#     sys.exit(1)  # Exit with error code


# directory to loop thru, WHEN WE HAD IT DOWNLOAD TO A DESKTOP
# directory = r"C:\Users\clave\OneDrive\Desktop\Scheduler_app_resources\ra_schedules"

# dynamically gets number of RAs that should be in the schedule
num_ras = len(data)
# print(num_ras)
num_days = 5  # m-f
num_shifts = 11  # 9-8  == 11 shifts

all_ras = list(range(num_ras))
all_days = list(range(num_days))
all_shifts = list(range(num_shifts))


# # 1 means unavailable:
# # [ [11 bits for M], [11 bits for T], [11 bits for W], [11 bits for R], [11 bits for F] ], <-- this is Amber
# # [ [11 bits for M], [11 bits for T], [11 bits for W], [11 bits for R], [11 bits for F] ], <-- this is Caroline
# # [ [11 bits for M], [11 bits for T], [11 bits for W], [11 bits for R], [11 bits for F] ], <-- this is Dean
# unavailabilityMatrix = []

ra_list = [ra_data['userName'] for ra_data in data]

# a big array, where each ra has an array and their array has 5 arrays for the days, filled with 11 0s for the shifts (means fully available)
unavailability_matrix = [
    [[0 for _ in range(num_shifts)] for _ in range(num_days)] for _ in range(num_ras)]

# Iterate over files in directory
# for name in os.listdir(directory):
#     # Open file
#     # creates path for every filename by appending it
#     with open(os.path.join(directory, name)) as f:
#         ra_name = name.split('-')[0]
#         ra_list.append(ra_name)  # ra name list, also gives us their index
#         ra_spot_in_matrix = ra_list.index(ra_name)
#         csvFile = csv.reader(f)
#         for line in csvFile:
#             for dayNum in range(len(line)):
#                 # each day only has the shifts that don't work
#                 for unavail in line[dayNum].split(','):
#                     if (unavail):
#                         intUnavail = (int(unavail))
#                         # change 0 to 1 to show unavailable, subtract 9 to account for starting at 9
#                         unavailability_matrix[ra_spot_in_matrix][dayNum][intUnavail-9] = 1


days_mapping = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4
}

for ra_data in data:
    ra_name = ra_data['userName']
    ra_index = ra_list.index(ra_name)
    for day, unavailable_shifts in ra_data['unavailability'].items():
        if unavailable_shifts.strip():  # Skip empty strings
            day_num = days_mapping[day]
            for shift in map(int, unavailable_shifts.split(',')):
                unavailability_matrix[ra_index][day_num][shift - 9] = 1


# NOW unavailability matrix is full


model = cp_model.CpModel()

# ADDING METHODS are for ADDING CONSTRAINTS TO THE MODEL!!!

shifts = {}
# key (r,d,s) value: 0 or 1
# (r,d,s):0 that means they are not assigned that shift
for r in all_ras:
    for d in all_days:
        for s in all_shifts:
            shifts[(r, d, s)] = model.new_bool_var(f"shift_ra{r}_d{d}_s{s}")
            # shifts[(r, d, s)] equals 1 if shift s is assigned to ra r on day d, and 0 otherwise

# Constraints

# CONSTRAINT 1: for each shift, the sum of the ras assigned to that shift should be between 2 and 4
for d in all_days:
    for s in all_shifts:
        model.Add(sum(shifts[(r, d, s)] for r in all_ras) >= 2)
        model.Add(sum(shifts[(r, d, s)] for r in all_ras) <= 4)


# CONSTRAINT 2: if ra is unavailable that day, do not schedule them
for ra in all_ras:
    for shift in all_shifts:
        for day in all_days:
            if unavailability_matrix[ra][day][shift]:
                model.Add(shifts[ra, day, shift] == 0)


# CONSTRAINT 3: Each RA's total shifts across the week should be between 3
for ra in all_ras:  # for each RA, the model is going to sum all their shifts assigned and that is THEIR shifts_assigned #
    shifts_assigned = sum(shifts[(ra, d, s)]
                          # for this RA, for all their tuples of days and shifts, get the sum (of the value which is either 0 or 1)
                          for d in all_days for s in all_shifts)
    # model.Add(shifts_assigned)
    # then this constraint says that this number ^ HAS less than or =4 so everyone can have at most 4 hours per week and if this doesnt work there needs to be more RAs or less shifts
    model.Add(shifts_assigned <= 4)

# CONSTRAINT 4: At least 2 RAs per shift
# for d in all_days:
#     for s in all_shifts:
#         # Ensure at least 2 RAs are assigned to each shift
#         model.Add(sum(shifts[(r, d, s)] for r in all_ras) >= 2)
#         # don't give it a maximum to be safe so that if EVERY RA NEEDS to have 3 shifts but there are not enough days, there can be more than 4 at each desk


# Constraint 4
# Define consecutive shifts variables and objective
consecutive_shifts = {}
for r in all_ras:
    for d in all_days:
        for s in range(num_shifts - 1):
            consecutive_shifts[(r, d, s)] = model.NewBoolVar(
                f'consec_{r}_{d}_{s}')
            model.AddBoolOr([shifts[(r, d, s)].Not(), shifts[(
                r, d, s+1)].Not()]).OnlyEnforceIf(consecutive_shifts[(r, d, s)])
            model.AddBoolAnd([shifts[(r, d, s)], shifts[(r, d, s+1)]]
                             ).OnlyEnforceIf(consecutive_shifts[(r, d, s)])

# Maximize the number of consecutive shifts
model.Maximize(sum(consecutive_shifts[(
    r, d, s)] for r in all_ras for d in all_days for s in range(num_shifts - 1)))


solver = cp_model.CpSolver()
status = solver.Solve(model)

csv_data = [[''] * num_days for _ in all_shifts]
day_headers = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

# for d in all_days:
#     csv_data.append([day_headers[d]] + [''] * num_shifts)

# if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
#     for day in all_days:
#         for shift in all_shifts:
#             ra_assigned = ''
#             for ra in all_ras:
#                 # if the solver has a value for the tuple ra,day, and shift
#                 if solver.Value(shifts[(ra, day, shift)]):
#                     ra_assigned = f"RA {ra_list[ra]}"  # gets actual name
#                     if csv_data[shift][day]:  # If there's already data there
#                         csv_data[shift][day] += f", {ra_assigned}"
#                     else:  # If it's empty
#                         csv_data[shift][day] = ra_assigned
#             # csv_data[shift][day] = (ra_assigned)

# # max number assigned to a shift
# # max_ras_per_shift = max(len(csv_data[shift][day].split(
# #     ", ")) for shift in all_shifts for day in all_days)

#     with open("../desk_schedule.csv", 'w', newline='') as csvfile:
#         writer = csv.writer(csvfile)
#         writer.writerow(["Shift"] + [f"{day}" for day in day_headers])
#         # Write the schedule data
#         for shift in range(num_shifts):
#             writer.writerow(
#                 # writes entire line of M-F for the given shift
#                 [f'Time: {(shift+9) % 12 if (shift+9) % 12 != 0 else 12} '] + csv_data[shift])

schedule = []

if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
    for day in all_days:
        daily_schedule = {"day": day_headers[day], "shifts": []}
        for shift in all_shifts:
            assigned_ras = []
            for ra in all_ras:
                if solver.Value(shifts[(ra, day, shift)]):  # If RA is assigned
                    # Add RA's actual name
                    assigned_ras.append(ra_list[ra])
            # Append shift data to the daily schedule
            daily_schedule["shifts"].append({
                "assigned": assigned_ras
            })
        # Add the daily schedule to the overall schedule
        schedule.append(daily_schedule)

    # Dump JSON to stdout
    print(json.dumps(schedule, indent=2))


else:
    print("no solution")
    sys.exit(1)  # errors out
