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

## Tips and tricks

The `message` command can be used to show an introduction for the test subject but it only takes pictures as argument.

A simple way to create PNG:s with text is ImageMagics `convert`. Here is an example where the text is stored in 
`message.txt` and `message.png` is created:

`convert -size 480x480 xc:black -font "FreeMono" -pointsize 18 -fill white \
-annotate +15+20 "-- Intructions-- \nPress 'a' for left and 'l' for right\n\n(press space to continue)" intro.png`

The PNG can be viewed with `magic display intro.png`. Install `magic` with `sudo apt-get install -y magic` if it's not 
installed already.

Use `convert -list font` to list the fonts that are installed.


## Installation

Running Linux Mint xfce version 19.

Had to do `sudo sudo apt-get install -y ruby-dev libgtk2.0-dev rake` 
and then: `sudo gem install gtk2`


