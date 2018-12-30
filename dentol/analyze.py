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
from statsmodels.stats.power import TTestIndPower

# calculate power curves for varying sample and effect size
from numpy import array
from matplotlib import pyplot
from statsmodels.stats.power import TTestIndPower


# Constants & config
# ------------------

pd.options.display.float_format = '{:,.2f}'.format

ALPHAS = [0.05, 0.10, 0.20, 0.30, 0.35, 0.40]
SKEWED = False
SEPARATOR = ' '
OUTLIER_LIMIT = 10000
PATH_DATA_FILES = './data'
PATH_OUTPUT = './out'

DEBUG = True

def debug(*argv):
    if DEBUG:
        print('DEBUG:', *argv)

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
        debug('Reading file:', PATH_DATA_FILES + '/' + file)
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
    confint_ = list(map(lambda x: stats.t.ppf(1-x/2, df)*SP, ALPHAS))
    confint = list(map(lambda x: (MD - x, MD + x), confint_))
    t_values = list(map(lambda x: stats.t.ppf(1-x/2, df), ALPHAS))
    t_values_one_sided = list(map(lambda x: stats.t.ppf(1-x, df), ALPHAS))
    cohen_d = MD/SP

    if print_stats:
        print('\n----- STATS ----- (high=1 and low=2 elaboration)', )
        print('Means - MH:{:,.2f}, ML:{:,.2f}, MD:{:,.2f}, SD:{:,.2f}, df:{:,.2f}'.format(MH, ML, MD, SD, df))
        print('Standard errors - SH:{:,.2f}, SL:{:,.2f}, SP:{:,.2f}'.format(sqrt(SH2), sqrt(SL2), SP))
        print('Confidence intervals for myH-myL is MD+-t_df(alfa05/2)*SP:\n', ["(%0.2f, %0.2f)" % (x,y) for (x,y) in confint])
        print('Calculated t-test statistic: {:,.6f}'.format(MD/SD))
        print('Necessary t-values for alfa/2 (two-sided):', ["%0.2f" % i for i in t_values] )
        print('Necessary t-values for alfa (one-sided):', ["%0.2f" % i for i in t_values_one_sided] )
        print('ALPHAS used:', ALPHAS)
        print('Two-sided t-test from stats package (assumning same variance):', stats.ttest_ind(rows3Low['RT'], rows3High['RT'], equal_var=True))
        print('Two-sided t-test from stats package (assuming different variances):', stats.ttest_ind(rows3Low['RT'], rows3High['RT'], equal_var=False))

        t_stat, p_value = stats.ttest_ind(rows3Low['RT'], rows3High['RT'], equal_var=True)
        print('One-sided t-test from stats package (assumning same variance) - t-statistic: {:,.3f}, p-value:{:,.3f}'.format(t_stat, p_value/2) )
        t_stat, p_value = stats.ttest_ind(rows3Low['RT'], rows3High['RT'], equal_var=False)
        print('One-sided t-test from stats package (assumning different variances) - t-statistic: {:,.3f}, p-value:{:,.3f}'.format(t_stat, p_value/2) )
        print("Cohen's d: {:,.3f}".format(cohen_d))

        print('Two-sided Non-parametric Mann-Whitney test (not assuming normality):', stats.mannwhitneyu(rows3Low['RT'], rows3High['RT'], alternative='two-sided'))
        print('One-sided Non-parametric Mann-Whitney test (not assuming normality):', stats.mannwhitneyu(rows3Low['RT'], rows3High['RT'], alternative='greater'))

    return sdata, cohen_d


def power_analysis(alphas, effect, power):
    analysis = TTestIndPower()
    result = []
    for alpha in alphas:
        result.append(analysis.solve_power(effect, power=power, nobs1=None, ratio=1.0, alpha=alpha))
    print('Two-sided: effect: {:,.3f}, power: {:,.2f} => necessary sample sizes for the different alphas:'.format(effect, power),
          ["%0.1f" % i for i in result])

    result = []
    for alpha in alphas:
        result.append(analysis.solve_power(effect, power=power, nobs1=None, ratio=1.0, alpha=alpha, alternative='larger'))
    print('One-sided: effect: {:,.3f}, power: {:,.2f} => necessary sample sizes for the different alphas:'.format(effect, power),
          ["%0.1f" % i for i in result])

    sample_sizes = array(range(5, 100))
    analysis.plot_power(dep_var='nobs', nobs=sample_sizes, effect_size=[effect])
    pyplot.savefig(PATH_OUTPUT+'/power_analysis.png')
    pyplot.show()


# Show the results
# ------------------------
# Plot with Pandas funtions:
# https://pandas.pydata.org/pandas-docs/stable/visualization.html#visualization-kde

def plots(rows):
    stats.probplot(rows[rows['elabScenario'] == 2]['RT'], dist="norm", plot=pylab)
    pylab.title('elabScenario=2')
    pylab.savefig(PATH_OUTPUT+'/probplot_elabScenario_2.png')
    pylab.show()

    stats.probplot(rows[rows['elabScenario'] == 1]['RT'], dist="norm", plot=pylab)
    pylab.title('elabScenario=1')
    pylab.savefig(PATH_OUTPUT+'/probplot_elabScenario_1.png')
    pylab.show()

    boxplot = rows.boxplot(column=['RT'], by='elabScenario')
    boxplot.plot()
    plt.savefig(PATH_OUTPUT+'/boxplt.png')
    plt.show()

    rows.hist(column=['RT'], bins=10, by='elabScenario')
    plt.savefig(PATH_OUTPUT+'/hist.png')
    plt.show()


# Main
# ----

rows = read_data()

if SKEWED:
    rows['RT'] = rows['RT'].apply(np.sqrt)  # np.sqrt, np.log, lambda x: 1/x etc.

print('\n----- DATA -----\n', rows)
sdata, cohen_d = calc_stats(rows, True)
plots(rows)
power_analysis(ALPHAS, cohen_d, 0.8)
