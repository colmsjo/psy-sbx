### this is the analysis of one person's data

datafilename = "simon.psy.2012-12-09-2002.data"

### read data into table

data         = read.table( datafilename )
correct      = data[,5]==1 # flag correct trial
n            = dim(data)[1]  # number of trials
compatible   = data[,4] == "compatible"
incompatible = data[,4] == "incompatible"
rt           = data[,6]

### now report average response times in correct trials

print("Response speed in milliseconds")
print("Compatible")
print( mean( rt[ compatible & correct ] ))
print("Incompatible")
print( mean( rt[ incompatible & correct ] ))

### now report error rates

print("Error percentages in the two conditions")
print("Compatible")
print( sum( compatible & !correct ) / n * 100 )
print("Incompatible")
print( sum( incompatible & !correct ) / n * 100 )


