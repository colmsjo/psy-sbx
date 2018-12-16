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

Compile scripts with: `psycc -V -t -n test.psy`. `-V` shows the output of the
compiler (which otherwise isn't showed!) and `-t` prevents the compiler from
making the script owned by `root` and `-n` removes the splash screen.

Run `source setup.sh` and then compile with `psy test.psy` and the flags are set
automatically. `clean` will cleanup and remove data files etc (this should only
be used when developing!).

## Learn psytoolkit from scratch

I put this repo together while learning Psytoolkit (without any previous knowledge).
If you're in the same position, I'd suggest having a look at the `basics` folder
and check out the files in the following order:

1. `hello.psy`
2. `cross.psy`
3. `crosses.psy`
4. `strings.psy`
5. `expr.psy`
6. `readkey.psy`
7. `readmouse(2|3).psy`
8. `feedback.psy`

Then have a look at the `simon`, `simon_touch` and `choose` experiments.

NOTE: Some aspects of the Psytoolkit scripting language might seam unintuitive
if you have some programming experience. Variables only handles ints and variable
assignment is a bit odd. You'll see this when going through the files listed above.
Also `@n` referes to column `n` in the `table` used in `task` (see the
`choose` experiment).


## Tips and tricks

The `message` command can be used to show an introduction for the test subject
but it only takes pictures as argument.

A simple way to create PNG:s with text is ImageMagics `convert`. Here is an
example where the text is stored in `message.txt` and `message.png` is created:

`convert -size 800x600 xc:black -font "FreeMono" -pointsize 18 -fill white -gravity Center \
-annotate +10+20 "-- Instructions--\n\nPress 'a' for left and 'l' for right\n\n(press space to continue)" intro.png`

Use `convert -list font` to list the fonts that are installed.


## Installation

Running Linux Mint xfce version 19. Download Psytoolkit from https://www.psytoolkit.org/dldeb/.

I had to do `sudo sudo apt-get install -y ruby-dev libgtk2.0-dev rake`
and then: `sudo gem install gtk2`
