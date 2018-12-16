# psytoolkit

Getting started:

```
man psycc
man psyquest
psycc -h
psycc -s
psyquest -h
psyquest -s
psyquestcollect -h
```

Compile scripts with: `psycc -V -t -n test.psy`. `-V` shows the output of the compiler (which otherwise isn't showed!)
and `-t` prevents the compiler from making the script owned by `root` and `-n` removes the splash screen.

Run `source setup.sh` and then compile with `psy test.psy` and the flags are set automaticllay. `clean` will cleanup 
and remove data files etc (this should only be used when developing!).


## Installation

Running Linux Mint xfce version 19.

Had to do `sudo sudo apt-get install -y ruby-dev libgtk2.0-dev rake` 
and then: `sudo gem install gtk2`


