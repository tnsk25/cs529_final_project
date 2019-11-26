#Running this file structures the csv files created by Extract_Monthly.R file into a format suitable to feed into MongoDB
#Place this file in the folder which has the monthly files for a single climate varible and execute.
#Creates a single json file

import pandas as pd

for i in range(1901,2019):
    df = pd.read_csv(str(i)+".csv")
    df = df.pivot_table('value', ['Long', 'Lat'], 'variable')
    df.reset_index(inplace= True)
    df_values = df[df.columns.difference(['Long','Lat'])]
    values = df_values.values.tolist()
    df.drop(df.columns.difference(['Long','Lat']), axis=1, inplace=True)
    df[i] = values
    if i == 1901:
        df_final = df
    else:
        df_final[i] = df[i]

#Change the file name here accordingly
json_format = df_final.to_json(r'wet_monthly.json', orient='records')