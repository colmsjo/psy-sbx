import pandas as pd
import numpy as np

from os import listdir
from math import sqrt
from os.path import isfile, join
from scipy import stats

pd.options.display.float_format = '{:,.2f}'.format

PATH_DATA_FILES = './data'
SEPARATOR = ' '
alfa05 = 0.05
alfa10 = 0.10
alfa20 = 0.20
alfa30 = 0.30
alfa35 = 0.35
alfa40 = 0.40

# lists with dataframes, paths to data files and trial data (derived from the path of the data file)
dfs = []
files = [f for f in listdir(PATH_DATA_FILES) if isfile(join(PATH_DATA_FILES, f))]
trials = list(map(lambda s: tuple(s.split('.')[1:4]), files))

# Read the files into pandas data frames
i = 0
for file in files:
    df = pd.read_csv(PATH_DATA_FILES + '/' + file, SEPARATOR,
                     names = ['elabScenario','TASKNAME','TABLEROW','TRIALCOUNT','RT','negPos'])
    df['datetime'] = trials[i][0]
    df['guid'] = trials[i][2]
    i += 1
    df['rownum'] = np.arange(len(df))
    dfs.append(df)

data = pd.concat(dfs).reset_index()

# get the first data trial in the second set (row 3) and filter outliers
rows3 = data.loc[data['rownum']==3]
#rows3 = rows3[rows3['RT'] < 3000]

print('\n----- DATA -----\n', rows3)

sdata = pd.concat([rows3.groupby('elabScenario')['RT'].mean(),
                   rows3.groupby('elabScenario')['RT'].median(),
                   rows3.groupby('elabScenario')['RT'].var(),
                   rows3.groupby('elabScenario')['RT'].min(),
                   rows3.groupby('elabScenario')['RT'].max(),
                   rows3.groupby('elabScenario')['RT'].count()],
                   axis=1, keys=['mean', 'median', 'var', 'min', 'max', 'count'])

# MH: Mean high elab, ML: Mean low elab, MD: MH- ML, SD: Variance for MH-ML
# SH2: Sample variance high elab, SL2: Sample variance low elab, SP: Pooled sample variance
MH = sdata.loc[1]['mean']
ML = sdata.loc[2]['mean']
MD = MH - ML
SH2 = sdata.loc[1]['var']
SL2 = sdata.loc[2]['var']
NumH = sdata.loc[1]['count']
NumL = sdata.loc[2]['count']
df = NumH+NumL-2
SP = sqrt(((NumH-1)*SH2 +(NumL-1)*SL2) / (NumH+NumL-2))
SD = SP*sqrt(1/NumH + 1/NumL)
confint05 = stats.t.ppf(1-alfa05/2, df)*SP
confint10 = stats.t.ppf(1-alfa10/2, df)*SP
confint20 = stats.t.ppf(1-alfa20/2, df)*SP
confint30 = stats.t.ppf(1-alfa30/2, df)*SP
confint40 = stats.t.ppf(1-alfa40/2, df)*SP

print('\n----- STATS ----- (high=1 and low=2 elaboration)', )

print('Means - MH:{:,.2f}, ML:{:,.2f}, MD:{:,.2f}, SD:{:,.2f}, df:{:,.2f}'.format(MH, ML, MD, SD, df))
print('Standard errors - SH:{:,.2f}, SL:{:,.2f}, SP:{:,.2f}'.format(sqrt(SH2), sqrt(SL2), SP))
print('Confidence interval for myH-myL is MD+-t_df(alfa05/2)*SP is ({:,.2f} , {:,.2f})'.format(MD - confint05, MD + confint05))
print('Confidence interval for myH-myL is MD+-t_df(alfa10/2)*SP is ({:,.2f} , {:,.2f})'.format(MD - confint10, MD + confint10))
print('Confidence interval for myH-myL is MD+-t_df(alfa20/2)*SP is ({:,.2f} , {:,.2f})'.format(MD - confint20, MD + confint20))
print('Confidence interval for myH-myL is MD+-t_df(alfa30/2)*SP is ({:,.2f} , {:,.2f})'.format(MD - confint30, MD + confint30))
print('Confidence interval for myH-myL is MD+-t_df(alfa40/2)*SP is ({:,.2f} , {:,.2f})'.format(MD - confint40, MD + confint40))
print('confint05: {:,.2f}, confint10: {:,.2f}, confint20: {:,.2f}, confint30: {:,.2f}, confint40: {:,.2f}'.format(confint05, confint10, confint20, confint30, confint40))
print('t-values for alfa/2 - t05: {:,.2f}, t10: {:,.2f}, t20: {:,.2f}, t30: {:,.2f}, t35: {:,.2f}, t40: {:,.2f}'.format(
    stats.t.ppf(1-alfa05/2, df),
    stats.t.ppf(1-alfa10/2, df),
    stats.t.ppf(1-alfa20/2, df),
    stats.t.ppf(1-alfa30/2, df),
    stats.t.ppf(1-alfa35/2, df),
    stats.t.ppf(1-alfa40/2, df)))

print('t-test statistic: {:,.6f}'.format(MD/SD))

print('\n-- t-test --')
cat1 = rows3[rows3['elabScenario']==1]
cat2 = rows3[rows3['elabScenario']==2]

print(stats.ttest_ind(cat1['RT'], cat2['RT']))

'''
print('\n\n**** Inverted reaction times ****')

#rows3['INV RT'] = rows3.apply(lambda row: 1 / row['RT'], axis=1)
rows3.loc[:,'INV_RT'] = rows3.apply(lambda row: 1 / row['RT'], axis=1)
#rows3.assign(INV_RT = rows3.apply(lambda row: 1 / row['RT'], axis=1))
#print('DEBUG: res:\n', rows3)

print('\n-- Groupby mean / min / max --')
print(pd.concat([rows3.groupby('elabScenario')['INV_RT'].mean(),
                 rows3.groupby('elabScenario')['INV_RT'].min(),
                 rows3.groupby('elabScenario')['INV_RT'].max()], axis=1))

cat1 = rows3[rows3['elabScenario']==1]
cat2 = rows3[rows3['elabScenario']==2]

print('\n-- t-test --')
print(ttest_ind(cat1['INV_RT'], cat2['INV_RT']))
'''
