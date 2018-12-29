#
# analyze.py
#
# 181229, Jonas Colmsjö
#
# References: Rice, 2017, Statistics and Data Anlysis

# Imports
# ----------

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import pylab

from os import listdir
from math import sqrt
from os.path import isfile, join
from scipy import stats


# Constants & config
# ------------------

pd.options.display.float_format = '{:,.2f}'.format

ALFAS = [0.05, 0.10, 0.20, 0.30, 0.35, 0.40]
SKEWED = False
SEPARATOR = ' '
OUTLIER_LIMIT = 10000
PATH_DATA_FILES = './data'


# Read the data files
# -------------------

def read_data():
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
    rows3 = rows3[rows3['RT'] < OUTLIER_LIMIT]

    return rows3


# Calculate the statistics
# ------------------------

def calc_stats(rows3, print_stats=False):
    sdata = pd.concat([rows3.groupby('elabScenario')['RT'].mean(),
                       rows3.groupby('elabScenario')['RT'].median(),
                       rows3.groupby('elabScenario')['RT'].var(),
                       rows3.groupby('elabScenario')['RT'].min(),
                       rows3.groupby('elabScenario')['RT'].max(),
                       rows3.groupby('elabScenario')['RT'].count()],
                       axis=1, keys=['mean', 'median', 'var', 'min', 'max', 'count'])

    rows3Low  = rows3[rows3['elabScenario'] == 2]
    rows3High = rows3[rows3['elabScenario'] == 1]

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
    confint_ = list(map(lambda x: stats.t.ppf(1-x/2, df)*SP, ALFAS))
    confint = list(map(lambda x: (MD - x, MD + x), confint_))
    t_values = list(map(lambda x: stats.t.ppf(1-x/2, df), ALFAS))

    if print_stats:
        print('\n----- STATS ----- (high=1 and low=2 elaboration)', )
        print('Means - MH:{:,.2f}, ML:{:,.2f}, MD:{:,.2f}, SD:{:,.2f}, df:{:,.2f}'.format(MH, ML, MD, SD, df))
        print('Standard errors - SH:{:,.2f}, SL:{:,.2f}, SP:{:,.2f}'.format(sqrt(SH2), sqrt(SL2), SP))
        print('Confidence intervals for myH-myL is MD+-t_df(alfa05/2)*SP:\n', ["(%0.2f, %0.2f)" % (x,y) for (x,y) in confint])
        print('Calculated t-test statistic: {:,.6f}'.format(MD/SD))
        print('t-values for alfa/2:', ["%0.2f" % i for i in t_values] )
        print('alfas used:', ALFAS)
        print('t-test from stats package (assumning same variance):', stats.ttest_ind(rows3High['RT'], rows3Low['RT'], equal_var=True))
        print('t-test from stats package (assuming different variances):', stats.ttest_ind(rows3High['RT'], rows3Low['RT'], equal_var=False))

    return sdata


# Show the results
# ------------------------
# Plot with Pandas funtions:
# https://pandas.pydata.org/pandas-docs/stable/visualization.html#visualization-kde

def plots(rows):
    stats.probplot(rows[rows['elabScenario'] == 2]['RT'], dist="norm", plot=pylab)
    pylab.title('elabScenario=2')
    pylab.show()
    stats.probplot(rows[rows['elabScenario'] == 1]['RT'], dist="norm", plot=pylab)
    pylab.title('elabScenario=1')
    pylab.show()

    boxplot = rows.boxplot(column=['RT'], by='elabScenario')
    boxplot.plot()
    plt.show()
    rows.hist(column=['RT'], bins=10, by='elabScenario')
    plt.show()


# Main
# ----

rows = read_data()

if SKEWED:
    rows['RT'] = rows['RT'].apply(np.sqrt)  # np.sqrt, np.log, lambda x: 1/x etc.

print('\n----- DATA -----\n', rows)
sdata = calc_stats(rows, True)
plots(rows)
