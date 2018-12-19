//////////////////////////////////////////////////////////////////////
//
// LIBRARY FUNCTIONS
//
//////////////////////////////////////////////////////////////////////

var MAXSPRITES=100;
var MAXBITMAPS=1000;

//////////////////////////////////////////////////////////////////////

var PSY_CENTRAL = -99999 ;

var MAX_FONTS = 100 ;
var psy_font_number = 0 ;
var psy_fonts = new Array() ; // in this case, just like "20px Arial", as used by javascript/canvas
var psy_fonts_size = new Array() ; // in Javascript only (not PsyToolkit Java/C modes), the font size is stored in this global var

var PSY_VIDEO_DOUBLEBUFFER = 1 ; // this is the default and currently only option)

var PSY_KEY_STATUS_CORRECT = 1 ;
var PSY_KEY_STATUS_WRONG   = 2 ;
var PSY_KEY_STATUS_TIMEOUT = 3 ;

var psy_screen_center_x = 0 ;
var psy_screen_x_offset = 0 ;
var psy_screen_center_y = 0 ;
var psy_screen_y_offset = 0 ;
var psy_screen_width    = 800 ;
var psy_screen_height   = 600 ;

var psy_exp_start_time = 0 ;
var psy_exp_current_time = 0 ;

var psy_blockorder = 1; // higher than 1 if more than one blockorder defined

//////////////////////////////////////////////////////////////////////
// some functions for dealing with current tasks (in C these are part
// of the task, here global variables)
var tablerow = 0 ;

//////////////////////////////////////////////////////////////////////
// some keyboard related variables

var keystatus = { key:0 , status: 0 , time: 0 , totaltime : 0 , mouse_x : 0 , mouse_y : 0 , bitmap: 0 }

var possiblekeys = new Array(); // this is the array used in all readkey functions

// TEST, new in 2.5.1 -- maybe move to different variable
var readkeys_option_size = 0 ; // default is endless (no max size)
var readkeys_option_show = 1 ; // default letters are shown
var readkeys_option_font = 0 ; // default is first font

var mousestatus = { key:0 , status: 0 , time: 0 , totaltime : 0 , x : 0 , y : 0 }

var c=document.getElementById("exp"); // this is the canvas element
var canvas_x_offset = c.getBoundingClientRect().left ; // used for getting correct mouse position
var canvas_y_offset = c.getBoundingClientRect().top ; // because mouse position is relative to window, not elements

/// TODO -- can remove these from here once new keyboard code works

// moved key event listener from here
// window.addEventListener("keydown",getkeydown,true); // note the even listener works for whole web page... CHECK: does it need to be "true"
// window.addEventListener("keyup"  ,getkeyup  ,true); // note the even listener works for whole web page...

var psy_mouse_cursor = 0 ; // currently visible (1) or not (0)
var psy_mouse_store = 0 ; // tmp storage of mouse for pager and wait_key

var ctx=c.getContext("2d");

// log stores log output which is helpful for debuggin, see function addlog()
var log = document.getElementById("log") ; // for debugging only

// in debug mode this is visible, otherwise this is a String variable being filled witht he user data
var output = document.getElementById("Output") ; 
outputdata = String()

var psy_bitmaps = new Array() ;
var psy_bitmaps_loaded = 0 ; // codes if bitmaps have been loaded (Javascript only)
var psy_sounds_loaded = 0 ; // codes if audio files have been loaded (Javascript only)

var bmp_number = 0 ; //number of bitmaps loaded

var psy_sounds = new Array();
var psy_sound_number = 0 ;

function psy_stimuli_loaded(){ // NEW IN 2.3.5
    var percentage = 0 ;

    total_stimuli = bmp_number + psy_sound_number
    total_loaded = psy_bitmaps_loaded + psy_sounds_loaded

    if ( total_stimuli > 0 )
	percentage = Math.round( total_loaded / total_stimuli * 100.0 ) ;
    else
	percentage = 100 ;

    tmp = (psy_bitmaps_loaded < bmp_number)||(psy_sounds_loaded < psy_sound_number)

    if ( tmp && percentage < 100 ) return( percentage );
    if ( tmp && percentage == 100 ) return( 99 );
    if ( (psy_bitmaps_loaded == bmp_number) && (psy_sounds_loaded == psy_sound_number) )
	return( 100 );
}

// this function does not go on with <functionname> unless stimuli are
// loaded. It checks every second if stimulus loading has been
// completed

function when_stimuli_loaded_do ( functionname ){
    tmp = psy_stimuli_loaded() ;
    ctx.fillStyle = hexrgb(0,0,0);
    ctx.fillRect(0,0,psy_screen_width,psy_screen_height);
    ctx.font = "30px Arial";
    ctx.fillStyle="white";
    ctx.textAlign="left"

    if ( tmp < 100 ){
        if ( tmp == 0 )
	    ctx.fillText("Loading data",100,100);
	else
	    ctx.fillText("Loading data "+tmp+"%",100,100);
	setTimeout( when_stimuli_loaded_do , 250 , functionname );
    }
    else
    {
	setTimeout( functionname , 0 );
    }
}

function psy_load_bitmap( name ){
    psy_bitmaps[ bmp_number ] = new Image() ;
    psy_bitmaps[ bmp_number ].onload = function(){ psy_bitmaps_loaded++ } ;
    psy_bitmaps[ bmp_number ].src = name ;
    bmp_number ++ ;
    return( bmp_number - 1 );
}

function psy_load_sound( name ){
    psy_sounds[ psy_sound_number ] = new Audio() ;
    psy_sounds[ psy_sound_number ].onloadeddata = function(){ psy_sounds_loaded++ } ;
    psy_sounds[ psy_sound_number ].src = name ;

    psy_sound_number ++ ;
    return( psy_sound_number - 1);
}

function psy_play( sound ){
    psy_sounds[ sound - 1 ].play();
}

function psy_silence( sound ){
    psy_sounds[ sound - 1 ].pause();
    psy_sounds[ sound - 1 ].currentTime = 0 ; // rewind
}

// in javascript, we currently only use browser based fonts, not real files
function psy_load_font( name , size ){
    psy_fonts[psy_font_number] = size+"pt "+name ;
    psy_fonts_size[psy_font_number] = size ;
    psy_font_number ++ ;
    return ( psy_font_number - 1 );
}

function addlog(text) {
    if ( log != null )
    {
	log.value += text + "\n";
        log.scrollTop = log.scrollHeight;
    }
}

function addoutput(text){
    if ( output != null ) output.value += text+"\n";
    outputdata = outputdata + text + "\n"
}

function hexrgb( r , g , b  ){
    h = "#"
    if ( r < 16 ) h=h+"0"+r.toString(16); else h=h+r.toString(16) ;
    if ( g < 16 ) h=h+"0"+g.toString(16); else h=h+g.toString(16) ;
    if ( b < 16 ) h=h+"0"+b.toString(16); else h=h+b.toString(16) ;
    return(h);
}

starttime = 0 ;

// note, Javascript passes by reference (i.e., pointers), so in the following, it actually works similary to C

// since 2.0.10 -> these need to be called before calling psy_keyboard
function psy_expect_keyboard(){
    psy_readkey.expect_keyboard = true ;
    window.addEventListener("keydown",getkeydown,true); // note the even listener works for whole web page... CHECK: does it need to be "true"
    window.addEventListener("keyup"  ,getkeyup  ,true); // note the even listener works for whole web page...
    psy_readkey.keyupeventlistener = true ;
    psy_readkey.keydowneventlistener = true ;    
}

function psy_expect_mouse(){ psy_readkey.expect_mouse = true ; }

function psy_keyboard( possiblekeys , nkeys, correctkey , maxtime ){
    psy_readkey.expectedkey = possiblekeys[ correctkey ];
    psy_readkey.keys = possiblekeys ;
    psy_expect_keyboard() ;
    psy_readkey.start( current_task , maxtime );
}

var psy_readkey = {
    lasttask: "",
    starttime: 0,
    readkeytimer: "",
    rt: 0,
    key: 0,
    status: 0,
    keys: [], // will contain the asciicodes of possible keys
    expect_keyboard: false,
    expect_mouse: false,
    expectedkey: 0,
    bitmap: 0, // if we are waiting for a mouse over bitmap event
    bitmap_range: [-1,-1] , // if we are waiting for a mouse key over a bitmap with a specific range of bitmap numbers
    mouseovereventlistener: false, // this helps to remove non-needed high resource demanding eventlistener
    mousedowneventlistener: false, // this helps to remove non-needed high resource demanding eventlistener
    keyupeventlistener: false,
    keydowneventlistener: false,

    start: function(task, maxtime) {
        psy_readkey.rt = maxtime; // if it never gets changed, it means all time has been used
        psy_readkey.key = 0;
        psy_readkey.starttime = new Date().getTime();
        psy_readkey.lasttask = task;
        psy_readkey.readkeytimer = setTimeout( "psy_readkey.timeout()", maxtime); 
        keystatus.status = 3; // assume timeout, will be changed in getkey
	keystatus.bitmap = -1 ; // the bitmap under cursor, if in some mouse function (since 2.3.6)
        keystatus.time = maxtime; // assume timeout, will be changed in getkey; // if it never gets changed, it means all time has been used
        keystatus.key = 0; // assume timeout, will be changed in getkey
        // addlog("in psy_readkey -- expect_boardkey: " + psy_readkey.expect_keyboard); //DEBUG
    },

    stop: function() {
        // addlog("stop readkey__") //DEBUG
        clearTimeout(psy_readkey.readkeytimer);
        psy_readkey.expect_keyboard = false; // insurance, this is already done in getkey/getmouse
        psy_readkey.expect_mouse = false; // insurance, this is already done in getkey/getmouse	
	if ( psy_readkey.mouseovereventlistener == true ){
	    window.removeEventListener("mousemove",getmouse_in_area,false) ; 
	    psy_readkey.mouseovereventlistener = false 
	}
	if ( psy_readkey.mousedowneventlistener == true ){
	    window.removeEventListener("mousedown",getmouseclick_in_area,false) ; 
	    psy_readkey.mousedowneventlistener = false 
	}
	if ( psy_readkey.keyupeventlistener == true ){
	    window.removeEventListener("keyup",getkeyup,false) ; 
	    psy_readkey.keyupeventlistener = false ;
	}
	if ( psy_readkey.keydowneventlistener == true ){
	    window.removeEventListener("keydown",getkeydown,false) ; 
	    psy_readkey.keydowneventlistener = false ;
	}
        // eval(psy_readkey.lasttask + ".run()");
	setTimeout(psy_readkey.lasttask + ".run()",0);	
    },

    timeout: function(){
        //addlog("stop readkey because of timeout") //DEBUG
        psy_readkey.expect_keyboard = false;
        psy_readkey.expect_mouse = false;	
	if ( psy_readkey.mouseovereventlistener == true ){
	    window.removeEventListener("mousemove",getmouse_in_area,false) ; 
	    psy_readkey.mouseovereventlistener = false 
	}
	if ( psy_readkey.mousedowneventlistener == true ){
	    window.removeEventListener("mousedown",getmouseclick_in_area,false) ; 
	    psy_readkey.mousedowneventlistener = false 
	}
        // eval(psy_readkey.lasttask + ".run()");
	setTimeout(psy_readkey.lasttask + ".run()",0);	
    }
}

// -------------------------------------------------------------------

var psy_readkeys = {
    lasttask: "",
    starttime: 0,
    readkeytimer: "",
    rt: 0,
    key: 0,
    status: 0,
    keys: [], // will contain the asciicodes of possible keys
    expect_keyboard: false,
    expect_mouse: false,
    expectedkey: 0,
    bitmap: 0, // if we are waiting for a mouse over bitmap event
    bitmap_range: [-1,-1] , // if we are waiting for a mouse key over a bitmap with a specific range of bitmap numbers
    mouseovereventlistener: false, // this helps to remove non-needed high resource demanding eventlistener
    mousedowneventlistener: false, // this helps to remove non-needed high resource demanding eventlistener
    keyupeventlistener: false,
    keydowneventlistener: false,

    start: function(task, maxtime) {
        psy_readkey.rt = maxtime; // if it never gets changed, it means all time has been used
        psy_readkey.starttime = new Date().getTime();
        psy_readkey.lasttask = task;
        psy_readkey.readkeytimer = setTimeout( "psy_readkey.timeout()", maxtime); 
        keystatus.status = 3; // assume timeout, will be changed in getkey
	keystatus.bitmap = -1 ; // the bitmap under cursor, if in some mouse function (since 2.3.6)
        keystatus.time = maxtime; // assume timeout, will be changed in getkey; // if it never gets changed, it means all time has been used
        keystatus.key = 0; // assume timeout, will be changed in getkey
    },

    stop: function() {
        clearTimeout(psy_readkey.readkeytimer);
        psy_readkey.expect_keyboard = false; // insurance, this is already done in getkey/getmouse
        psy_readkey.expect_mouse = false; // insurance, this is already done in getkey/getmouse	
	if ( psy_readkey.mouseovereventlistener == true ){
	    window.removeEventListener("mousemove",getmouse_in_area,false) ; 
	    psy_readkey.mouseovereventlistener = false 
	}
	if ( psy_readkey.mousedowneventlistener == true ){
	    window.removeEventListener("mousedown",getmouseclick_in_area,false) ; 
	    psy_readkey.mousedowneventlistener = false 
	}
	if ( psy_readkey.keyupeventlistener == true ){
	    window.removeEventListener("keyup",getkeyup,false) ; 
	    psy_readkey.keyupeventlistener = false ;
	}
	if ( psy_readkey.keydowneventlistener == true ){
	    window.removeEventListener("keydown",getkeydown,false) ; 
	    psy_readkey.keydowneventlistener = false ;
	}
        // eval(psy_readkey.lasttask + ".run()");
	setTimeout(psy_readkey.lasttask + ".run()",0);	
    },

    timeout: function(){
        //addlog("stop readkey because of timeout") //DEBUG
        psy_readkey.expect_keyboard = false;
        psy_readkey.expect_mouse = false;	
	if ( psy_readkey.mouseovereventlistener == true ){
	    window.removeEventListener("mousemove",getmouse_in_area,false) ; 
	    psy_readkey.mouseovereventlistener = false 
	}
	if ( psy_readkey.mousedowneventlistener == true ){
	    window.removeEventListener("mousedown",getmouseclick_in_area,false) ; 
	    psy_readkey.mousedowneventlistener = false 
	}
        // eval(psy_readkey.lasttask + ".run()");
	setTimeout(psy_readkey.lasttask + ".run()",0);	
    }
}

// ----------------------------------------------------------------------

var pager_options = { // for use in psy_mouse_pager
    back: 0, backX: 0, backY: 0 ,
    next: 0, nextX: 0, nextY: 0 ,
    quit: 0, quitX: 0, quitY: 0
}

var inkeypress=0

function getkeydown( e ){
    //addlog("EVENT") //DEBUG
    // if ( e.keyCode == 27 ) { e.preventDefault() ; e.stopPropagation() ; }
    
    inkeypress++ // prevent people holding the key (only inkeypress == 1 is valid)

    // in the next line, check if a keypress is being expected, if we are in a keypress situation, and if the key code is
    // of the allowed keys

    if ( psy_readkey.expect_keyboard == true && inkeypress==1 && psy_readkey.keys.indexOf(e.keyCode) > -1 )
    {
	keystatus.time = new Date().getTime() - psy_readkey.starttime ;
	keystatus.key = psy_readkey.keys.indexOf(e.keyCode) ;

	if ( e.keyCode == psy_readkey.expectedkey ){
	    keystatus.status = 1
	    //addlog("correct key") //DEBUG
	}
	else {
	    keystatus.status = 2
	    //addlog("wrong key") //DEBUG
	}

	psy_readkey.expect_keyboard = false ;
	psy_readkey.stop();
	
	// addlog("key pressed") //DEBUG
    }
    else
    {
	inkeypress = 0
	// addlog("key pressed but not expected right now, or a non allowed key was pressed which will be ignored entirely") //DEBUG
    }
}

function getkeyup(e){
    // if ( e.keyCode == 27 ) { e.preventDefault() ; e.stopPropagation() ; }
    
    if ( inkeypress == 1 ){
	keystatus.totaltime = new Date().getTime() - psy_readkey.starttime ;
    }
    inkeypress = 0
}

function getmouse_in_area( e ){ // http://livecoding.io/3887542
    if ( psy_readkey.expect_mouse == true ){

	/* following two lines are important because mouse position is
	 * relative to browser "window", not "canvas" */
	canvas_x_offset = c.getBoundingClientRect().left ;
	canvas_y_offset = c.getBoundingClientRect().top	    
	tmpmouseX = e.clientX - canvas_x_offset ; // in canvas coordinates
        tmpmouseY = e.clientY - canvas_y_offset ;

	//addlog( tmpmouseX+" ? x >= "+psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.x + " x <= " + psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.x+psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.w )
	//tmp=psy_stimuli1[ psy_readkey.bitmap - 1 ].rect
	//addlog( "x = "+tmp.x+" y = "+tmp.y+" w = "+tmp.width+" h = "+tmp.height )

	if ( tmpmouseX >= psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.x &&
             tmpmouseX <= psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.x+psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.width &&
	     tmpmouseY >= psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.y &&
             tmpmouseY <= psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.y+psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.height ){
	    keystatus.time = new Date().getTime() - psy_readkey.starttime ;
	    keystatus.status = 1
	    keystatus.mouse_x = tmpmouseX - psy_screen_x_offset ; // save this in psytoolkit coordinates
	    keystatus.mouse_y = tmpmouseY - psy_screen_y_offset ; 
	    psy_readkey.expect_mouse = false
	    psy_readkey.stop()
	    // addlog("Mouse moved in area.")
	}
    }
}

function getmouseclick_in_area( e ){ // http://livecoding.io/3887542

    // this function only runs if mouse has been clicked.
    // e.button->0 is left and 1 is right

    // there are two ways to do this
    // case 1: there is no range of bitmaps to look for bitmap_range=[-1,-1]
    // it will just check if the mouse is in the area of the requested bitmap
    if ( psy_readkey.expect_mouse == true && psy_readkey.bitmap_range[1] == -1 ){
	keystatus.time = new Date().getTime() - psy_readkey.starttime ;

	canvas_x_offset = c.getBoundingClientRect().left ;
	canvas_y_offset = c.getBoundingClientRect().top	    
	tmpmouseX = e.clientX - canvas_x_offset
        tmpmouseY = e.clientY - canvas_y_offset

	var correctbitmapclicked = false ;
	if ( tmpmouseX >= psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.x &&
             tmpmouseX <= psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.x+psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.width &&
	     tmpmouseY >= psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.y &&
             tmpmouseY <= psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.y+psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.height ){
	    correctbitmapclicked = true

	    //addlog("bitmap undermouse (no range):"+psy_readkey.bitmap+" at X "+tmpmouseX+" at Y "+tmpmouseY )
	}

	//addlog( "mouseX = "+tmpmouseX+" should be between [" + psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.x + "," + (psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.x+psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.width) + "]" )
	//addlog( "mouseY = "+tmpmouseY+" should be between [" + psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.y + "," + (psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.y+psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.height) + "]" )		    

	
	if ( psy_readkey.expectedkey == e.button && correctbitmapclicked == true )
	    keystatus.status = 1
	else
	    keystatus.status = 2

	keystatus.mouse_x = tmpmouseX - psy_screen_x_offset
	keystatus.mouse_y = tmpmouseY - psy_screen_y_offset

	psy_readkey.expect_mouse = false
	psy_readkey.stop()
    }

    // case 2: there is a range of bitmaps to look for bitmap_range.
    // new since 2.3.6, the resulting bitmap will be stored as well in keystatus.bitmap
    if ( psy_readkey.expect_mouse == true && psy_readkey.bitmap_range[0] > -1 ){
	keystatus.time = new Date().getTime() - psy_readkey.starttime ;

	canvas_x_offset = c.getBoundingClientRect().left ;
	canvas_y_offset = c.getBoundingClientRect().top	    
	tmpmouseX = e.clientX - canvas_x_offset ; // note, we are here in CANVAS relative screen coordinates
        tmpmouseY = e.clientY - canvas_y_offset ;

	// step 1: figure out which bitmap the mouse is on
	//--->following line does not yet work, it always returns 0 | DEBUG

	// NOTE: change to psytoolkit coordinates, because that is what psy_bitmap_under_mouse uses
	var tmpbitmap = psy_bitmap_under_mouse( 0 , psy_readkey.bitmap_range[0] , psy_readkey.bitmap_range[1] ,
						tmpmouseX - psy_screen_x_offset , tmpmouseY - psy_screen_y_offset )

	// TODO TO CHECK
	// WE MIGHT NEED TO COPY tmpbitmap to keystatus.bitmap here as well (Oct 2017)

	//addlog("bitmap undermouse (range):"+tmpbitmap+" at X "+tmpmouseX+" at Y "+tmpmouseY+" in range: "+
	//       psy_readkey.bitmap_range[0] + " "+psy_readkey.bitmap_range[1] )

	// step 2: Only if the bitmap is in the range, respond to it
	if ( tmpbitmap >= psy_readkey.bitmap_range[0] && tmpbitmap <= psy_readkey.bitmap_range[1] ){
	
	    var correctbitmapclicked = false ;
	    keystatus.bitmap = tmpbitmap

	    if ( tmpmouseX >= psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.x &&
		 tmpmouseX <= psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.x+psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.width &&
		 tmpmouseY >= psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.y &&
		 tmpmouseX <= psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.x+psy_stimuli1[ psy_readkey.bitmap - 1 ].rect.height ){
		correctbitmapclicked = true
	    }

	    if ( psy_readkey.expectedkey == e.button && correctbitmapclicked == true )
		keystatus.status = 1
	    else
		keystatus.status = 2
	    
	    keystatus.mouse_x = tmpmouseX - psy_screen_x_offset
	    keystatus.mouse_y = tmpmouseY - psy_screen_y_offset
	    
	    psy_readkey.expect_mouse = false

	    psy_readkey.bitmap_range = [-1,-1] // return to standard value
	    
	    psy_readkey.stop()
	}
    }
}

//////////////////////////////////////////////////////////////////////
// further mouse functions
// these functions set some variables and timers and then return

// note, the mouse even listener seems to me resource intense, because
// it calls the function every time when the mouse is
// moved. Therefore, I decided to use this window listener only when
// needed, and it is set up and deleted only when needed with
// addEventListener and removeEventlistener

function psy_mouse_in_bitmap_rectangle( bitmap , maxwait )
{
    psy_readkey.bitmap = bitmap ;
    window.addEventListener("mousemove",getmouse_in_area,false) // use this listener only when needed
    psy_readkey.mouseovereventlistener = true
    psy_expect_mouse()    
    psy_readkey.start( current_task , maxwait );
}

function psy_mouse_click_bitmap_rectangle( mousebutton , bitmap , maxwait )
{
    psy_readkey.bitmap = bitmap ;
    if ( mousebutton=="l" ) { psy_readkey.expectedkey = 0 ; }else{ psy_readkey.expectedkey = 1 ; }
    window.addEventListener("mousedown",getmouseclick_in_area,false) // use this listener only when needed
    psy_readkey.mousedowneventlistener = true
    psy_expect_mouse()
    psy_readkey.start( current_task , maxwait );
}

// BEING TESTED FOR VERSION 1.9.5 // REMOVE THIS LINE ONCE IT WORKS
function psy_mouse_click_bitmap_rectangle_range( mousebutton , bitmap , maxwait , first , last )
{
    psy_readkey.bitmap = bitmap ;
    if ( mousebutton=="l" ) { psy_readkey.expectedkey = 0 ; }else{ psy_readkey.expectedkey = 1 ; }
    window.addEventListener("mousedown",getmouseclick_in_area,false) // use this listener only when needed
    psy_readkey.mousedowneventlistener = true
    psy_readkey.bitmap_range = [ first , last ]
    psy_expect_mouse()
    psy_readkey.start( current_task , maxwait );
}

// this function is necessary for the _range mouse functions
function psy_bitmap_under_mouse( searchdirection , first, last, x , y ) 
{
    // addlog("CALL: psybitmap_under_mouse( "+searchdirection+" , "+first+" , "+last+" , "+x+" , "+y+" )")
    
    /* x and y mouse given must be position in psytoolkit coordinate system (hence, needs to be corrected) */
    
    var i = 0 ; var j = 0 ; var tmp = 0 ;
    var found_bitmap = -1 ;
    var allchecked = 1 ; /* in c conditions: anything else than 0 is true */
    
    i = 0 ;
    // we assume we use double buffering, in C/Java this an option, in Javascript it is standard
    j = psy_stimuli1_n ; /* in double buffering, a different variable counts static stimuli */
    
    if ( first > -1 ) i = first - 1 ; /* bitmap numbers start with 1 */
    if ( last  > -1 ) j = last - 1 ;
	
    /* we need to iterate through all stimuli (bitmaps, but also
       rectangles), and we must make sure that the initial values are
       set correctly, the following two if statements just check if
       the searchdirection is correct
    */
    //addlog("search direction = "+searchdirection+" i = "+i+"  j = "+j)
    if ( searchdirection == 0 && i > j ) /* from low to high, i must be < than j */
    {
	tmp = j ; /* swap i and j */
	j = i   ;
	i = tmp ;
    }
    if ( searchdirection == 1 && i < j )  /* from high to low, i must be > than j */
    {
	tmp = j ; /* swap i and j */
	j = i   ;
	i = tmp ;
    }
    
    /* now iterate from i to j or from j to i, depending on search direction */
    
    while ( allchecked == 1 && found_bitmap == -1 )
    {
	//addlog("psy_screen_x_offset = "+psy_screen_x_offset)
	//addlog("In search for bitmap in psy_bitmap_under_mouse (x,y)" + x+" "+y)
	if ( x + psy_screen_x_offset >= psy_stimuli1[ i ].rect.x                              &&
	     x + psy_screen_x_offset <= psy_stimuli1[ i ].rect.x+psy_stimuli1[ i ].rect.width &&
	     y + psy_screen_y_offset >= psy_stimuli1[ i ].rect.y                              &&
	     y + psy_screen_y_offset <= psy_stimuli1[ i ].rect.y+psy_stimuli1[ i ].rect.height   )
	{
	    found_bitmap = i ;
	}else{
	    // THIS WHOLE ELSE IS DEBUG 1.9.7
	    //addlog("comp1 >= comp2 :: "+(x+psy_screen_x_offset)+" >= "+ psy_stimuli1[ i ].rect.x )
	}

	// DEBUG --> CHECK 1.9.7 THESE IFS NEED TO HAVE FOUNDBITMAP != -1
	if ( searchdirection == 0 && found_bitmap == -1 ) /* counter goes up, from i to j, from first to last */
	{
	    if ( i >= j ) allchecked = 0 ;
	    i++ ;
	}
	if ( searchdirection == 1 && found_bitmap == -1 ) /* counter goes up, from i to j, from first to last */
	{
	    if ( i <= j ) allchecked = 0 ;
	    i-- ;
	}
    }
    //addlog("FOUND BITMAP: "+(found_bitmap+1))
    return( found_bitmap + 1 );
}


//////////////////////////////////////////////////////////////////////
// functions that are often used from within block calls

function psy_wait( stimulus , key ) // can only be called from within block
{
    if ( stimulus != 0 ){
	psy_clear_stimulus_counters_db();
	psy_add_centered_bitmap_db( stimulus , PSY_CENTRAL,PSY_CENTRAL,0 );
        psy_draw_all_db();
    }

    if ( key >= 0 ){
	psy_readkey.expectedkey = key ;
	psy_readkey.keys = [ key ] ; // new in 2.0.5
	psy_expect_keyboard() ;
	psy_readkey.start( current_block , 99999999 ); // endless wait
    }else{ // mouse call, code copied from psy_mouse_click_bitmap_rectangle (except "current_block")
	psy_mouse_visibility( 1 ); // this will be automatically undone if needed through psycc calls
	psy_readkey.bitmap = 1 ;
	psy_readkey.expectedkey = 0 ;
	window.addEventListener("mousedown",getmouseclick_in_area,false) ; // use this listener only when needed
	psy_readkey.mousedowneventlistener = true ;
	psy_expect_mouse() ;
	psy_mouse_click_bitmap_rectangle( "l" , 1 , 9999999 );
	psy_readkey.start( current_block , 99999999 );
    }
}

var psy_pager = {
    original_block: "",
    current_bitmap_in_pager : 0 ,
    bitmaps: [],
    n: 0,

    start: function( bitmaps ){
	// first save which block you come from and later need to return to
	psy_pager.original_block = current_block ;
	psy_pager.n = bitmaps.length ;
	psy_pager.bitmaps = bitmaps ;
	// and now replace current block with this page function
	current_block = "psy_pager" ;
	// set which of the bitmaps is currently being shown
	psy_pager.current_bitmap_in_pager = 0 ;
	keystatus.key = -1 // make sure that the old keystatus is cleared.
	psy_pager.run()
    },

    // 32 = space, up = 38, down=40

    run: function(){
	//addlog( psy_pager.current_bitmap_in_pager )
	if ( (keystatus.key == 0 || keystatus.key == 1 ) && psy_pager.current_bitmap_in_pager < (psy_pager.n-1)  )
	    psy_pager.current_bitmap_in_pager ++ ;

	if ( keystatus.key == 2 && psy_pager.current_bitmap_in_pager > 0 )
	    psy_pager.current_bitmap_in_pager -- ;

	if ( keystatus.key == 3 ){ // keycode (81) in array for button press of letter Q
	    current_block = psy_pager.original_block ; 
	    psy_clear_screen_db() ;
	    setTimeout(current_block+".run()",10) // wait 10 ms to refresh screen CHECK
	}else{
	    // only if q not pressed
	    // addlog( psy_pager.current_bitmap_in_pager )
	    // psy_wait( psy_pager.bitmaps[ psy_pager.current_bitmap_in_pager ] , 32 ) // old (2.0.5)

	    psy_clear_stimulus_counters_db();
	    psy_add_centered_bitmap_db( psy_pager.bitmaps[ psy_pager.current_bitmap_in_pager ] , PSY_CENTRAL,PSY_CENTRAL,0 );
            psy_draw_all_db();

	    psy_readkey.expectedkey = 32 ;
	    psy_readkey.keys = [ 32,40,38,81 ] ; // space,up,down,q
	    psy_expect_keyboard() ;
	    psy_readkey.start( current_block , 99999999 ); // endless wait
	}
    }
}

function psy_store_mouse(){
    psy_mouse_store = psy_mouse_cursor ; // save mouse state (visibility)
}
function psy_restore_mouse(){
    psy_mouse_visibility( psy_mouse_store ); // restore mouse cursor state (visibility)
}

var psy_mouse_pager = {
    original_block: "",
    current_bitmap_in_pager : 0 ,
    read_all : false ,
    bitmaps: [],
    n: 0,

    start: function( bitmaps ){
	// first save which block you come from and later need to return to
	psy_mouse_pager.original_block = current_block ;
	psy_mouse_pager.n = bitmaps.length ;
	psy_mouse_pager.bitmaps = bitmaps ;
	// and now replace current block with this page function
	current_block = "psy_mouse_pager" ;
	// set which of the bitmaps is currently being shown
	psy_mouse_pager.current_bitmap_in_pager = 0 ;
	psy_mouse_pager.read_all = false ;	
	keystatus.key = -1 // make sure that the old keystatus is cleared.
	psy_mouse_pager.run()
	psy_store_mouse(); // saves state until restore
	psy_mouse_visibility( 1 );
    },

    run: function(){
	// addlog( psy_mouse_pager.current_bitmap_in_pager )
	if ( keystatus.bitmap == 3 && psy_mouse_pager.current_bitmap_in_pager < (psy_mouse_pager.n-1)  )
	{
	    psy_mouse_pager.current_bitmap_in_pager ++ ;
	    if ( psy_mouse_pager.current_bitmap_in_pager == psy_mouse_pager.n-1 )
		psy_mouse_pager.read_all = true ;
	}
	
	if ( keystatus.bitmap == 2 && psy_mouse_pager.current_bitmap_in_pager > 0 )
	    psy_mouse_pager.current_bitmap_in_pager -- ;

	if ( keystatus.bitmap == 4 ){ // keycode (81) in array for button press of letter Q
	    current_block = psy_mouse_pager.original_block ; 
	    psy_clear_screen_db() ;

	    psy_restore_mouse(); // visible or not

	    setTimeout(current_block+".run()",10) // wait 10 ms to refresh screen CHECK
	}else{
	    // only if quit is not clicked
	    // addlog( psy_mouse_pager.current_bitmap_in_pager )
	    // psy_wait( psy_mouse_pager.bitmaps[ psy_mouse_pager.current_bitmap_in_pager ] , 32 ) // old (2.0.5)

	    psy_clear_stimulus_counters_db();
	    psy_add_centered_bitmap_db( psy_mouse_pager.bitmaps[ psy_mouse_pager.current_bitmap_in_pager ] , PSY_CENTRAL,PSY_CENTRAL,0 );
	    psy_add_centered_bitmap_db( pager_options.back , pager_options.backX , pager_options.backY , 0 );
	    psy_add_centered_bitmap_db( pager_options.next , pager_options.nextX , pager_options.nextY , 0 );

	    if ( psy_mouse_pager.read_all == true ) // only show once all have been shown
		psy_add_centered_bitmap_db( pager_options.quit , pager_options.quitX , pager_options.quitY , 0 );

            psy_draw_all_db();
	    psy_expect_mouse() ;
	    psy_mouse_click_bitmap_rectangle_range( "l" , 2 , 9999999 , 2 , 4 );
	    psy_readkey.start( current_block , 99999999 ); // need to set it to "current_block" and endless wait
	}
    }
}

//////////////////////////////////////////////////////////////////////
// adding text to offline rendered images (here just another
// Javascript canvas. Code based on the Java version
// explained here: http://kaioa.com/node/103
//////////////////////////////////////////////////////////////////////

function psy_add_text_rgb_db( fontno , x , y , centerx , centery , r , g , b , text , align)
{
    /* this function renders text to a structure, which will then be rendered by psy_draw_all_db */
    var xpos=0, ypos=0,width=0,height=0; /* textpos on screen */

    psy_stimuli1[ psy_stimuli1_end ].x = x ;
    psy_stimuli1[ psy_stimuli1_end ].y = y ;        

    psy_stimuli1[ psy_stimuli1_end ].type = 2 ; // 2 is "text"
    psy_stimuli1[ psy_stimuli1_end ].on = 1 ;
    
    ctx.font = psy_fonts[ fontno ] ; // even though you do not draw on ctx, you need to set the font for measureText
    tmpsize = ctx.measureText(text); // size of string. Javascript does not give height, only width

    height  = psy_fonts_size[ fontno ] // just based on the pixel size, but this will ignore the bottom part of letters (see below)
    width   = tmpsize.width

    tmpgraphicsCanvas         = document.createElement("canvas")
    tmpgraphicsCanvas.width   = width

    // CHECK. This makes sure the bottom part of letters are displayed!
    // whether 1.3 is good or not is unclear, but it works nicely with Arial

    // For testing size, this is a good place to go:
    // https://www.w3schools.com/tags/tryit.asp?filename=tryhtml5_canvas_filltext

    tmpgraphicsCanvas.height  = Math.round( height * 2 )

    tmpgraphics = tmpgraphicsCanvas.getContext("2d")
    tmpgraphics.fillStyle = "rgba(0,0,0,0)"
    tmpgraphics.fillRect(0,0,width,height)

    tmpgraphics.fillStyle = hexrgb( r , g , b ) ; // text color
    tmpgraphics.font = psy_fonts[ fontno ]
    tmpgraphics.fillText( text , 0 , height + height/2)

    psy_stimuli1[ psy_stimuli1_end ].text = tmpgraphicsCanvas
    
    //////////////////////////////////////////////////////////////////////
    
    xpos = x ;
    ypos = y ;

    if ( align == 0 ){
	if ( x == PSY_CENTRAL && centerx == PSY_CENTRAL ) xpos = psy_screen_center_x - width / 2 ;
	if ( x != PSY_CENTRAL && centerx == PSY_CENTRAL ) xpos = x + psy_screen_x_offset - width / 2 ;
	if ( y == PSY_CENTRAL && centery == PSY_CENTRAL ) ypos = psy_screen_center_y - height ;
	if ( y != PSY_CENTRAL && centery == PSY_CENTRAL ) ypos = y + psy_screen_y_offset - height ;
    }
    if ( align == 1 ){
	if ( x == PSY_CENTRAL && centerx == PSY_CENTRAL ) xpos = psy_screen_center_x ;
	if ( x != PSY_CENTRAL && centerx == PSY_CENTRAL ) xpos = x + psy_screen_x_offset ;
	if ( y == PSY_CENTRAL && centery == PSY_CENTRAL ) ypos = psy_screen_center_y - height ;
	if ( y != PSY_CENTRAL && centery == PSY_CENTRAL ) ypos = y + psy_screen_y_offset- height ;
    }
    if ( align == 2 ){
	if ( x == PSY_CENTRAL && centerx == PSY_CENTRAL ) xpos = psy_screen_center_x - width ;
	if ( x != PSY_CENTRAL && centerx == PSY_CENTRAL ) xpos = x + psy_screen_x_offset - width ;
	if ( y == PSY_CENTRAL && centery == PSY_CENTRAL ) ypos = psy_screen_center_y - height ;
	if ( y != PSY_CENTRAL && centery == PSY_CENTRAL ) ypos = y + psy_screen_y_offset- height ;
    }
    
    if ( xpos < 0 ) xpos = 0 ;
    if ( ypos < 0 ) ypos = 0 ;
    if ( xpos > psy_screen_width ) xpos = psy_screen_width - width ;
    if ( ypos > psy_screen_height ) ypos = psy_screen_height - height ;

    /* -- coordinate setting dones -- */
    
    psy_stimuli1[ psy_stimuli1_end ].rect.x      = xpos ;
    psy_stimuli1[ psy_stimuli1_end ].rect.y      = ypos ;
    psy_stimuli1[ psy_stimuli1_end ].rect.width  = width ;
    psy_stimuli1[ psy_stimuli1_end ].rect.height = height ;
    
    psy_stimuli1_n ++ ;
    psy_stimuli1_end ++ ;
    return( psy_stimuli1_end );
}

//////////////////////////////////////////////////////////////////////

function psy_clear_screen_db()
{
    psy_clear_stimulus_counters_db();
    psy_draw_all_db();
}

//////////////////////////////////////////////////////////////////////

function psy_clear_stimuli1( number )
{
    var tmp ;
    
    if ( number < 0 )
	tmp = psy_stimuli1_end + number ; /* plus sign, because number is negative */
    else
	tmp = number - 1 ;

    // only do this is the stimulus has not already been cleared
    if ( psy_stimuli1[ tmp ].on != 0 ){
	psy_stimuli1[ tmp ].on = 0 ;
	psy_stimuli1_n -- ;
    }
}

function psy_unhide_stimuli1( number )
{
    var tmp ;
    
    if ( number < 0 )
	tmp = psy_stimuli1_end + number ; /* plus sign, because number is negative */
    else
	tmp = number - 1 ;

    // only do this is the stimulus has not already been cleared
    if ( psy_stimuli1[ tmp ].on != 1 ){
	psy_stimuli1[ tmp ].on = 1 ;
	psy_stimuli1_n ++ ;
    }
}

function psy_clear_range_db( low , high )
{
    var x = 0 ;
    var i = low ;
    var j = high ;
    if ( low > high ){ j=low ; i=high ; } // in case high < low
    for( x=i ; x <= j ; x++ ) psy_clear_stimuli1( x ) ;
}

function psy_unhide_range_db( low , high )
{
    var x = 0 ;
    var i = low ;
    var j = high ;
    if ( low > high ){ j=low ; i=high ; } // in case high < low
    for( x=i ; x <= j ; x++ ) psy_unhide_stimuli1( x ) ;
}


function psy_clear_stimulus_counters_db()
{
    var i = 0 ;
    while ( i < psy_stimuli1_n )
    {
	psy_stimuli1[i].on = 0 ;
	i++;
    }
    
    psy_stimuli1_n = psy_stimuli1_end = 0 ;
}

function psy_random( low, high )
{
    return ( Math.floor( Math.random()*(high-low+1)+low ));
}

function psy_random_weighted( chances , n )
{
    /* chances is a vector of numbers, whereby each chance is a value
       between 0 and 1. If the chance is 0, it will not be selected */
    
    var choosen = 0 ;
    var chance = 0 ;
    var max_chance = 0 ;
    var i ;

    /* the probability of choosing is weighted */
    
    for( i = 0 ; i < n ; i ++ )
    {
	if ( chances[i] > 0 ) /* only consider probs over 0 */
	{
	    chance = psy_random( chances[i]*10000 , 10000 );
	    
	    if ( chance > max_chance )
	    {
		max_chance = chance ;
		choosen = i ;
	    }
	}
    }
    return( choosen );
}

function psy_random_by( low, high , by )
{
    return( Math.floor( Math.random()*(high+by-low)/by)*by+low)
}

function psy_random_from_array( tmparray )
{
    return( tmparray[ Math.round(Math.random()*(tmparray.length-1)) ] )
}

function psy_draw_all_db()
{
    var i = 0 ;
    var activefound = 0 ; /* used to count how many of the active static stimuli have been drawn so far */

    ctx.fillStyle = hexrgb(0,0,0);
    ctx.fillRect(0,0,psy_screen_width,psy_screen_height);

    //addlog("xxx--"+activefound+" "+psy_stimuli1_n)
    
    while ( activefound < psy_stimuli1_n ) /* stimuli1 are the static stimuli; bitmaps,rectangles, and texts */
    {
	if ( psy_stimuli1[i].on == 1 )
	{
	    activefound ++ ; /* keep track how many stimuli you have drawn so far */

	    //addlog( "type: "+psy_stimuli1[i].type )
	    //addlog( "rect x: "+psy_stimuli1[i].rect.x)
	    switch ( psy_stimuli1[i].type )
	    {
	    case 0: /* draw a rectangle, as setup with psy_add_centered_rectangle */
		ctx.fillStyle = hexrgb( psy_stimuli1[i].r,psy_stimuli1[i].g,psy_stimuli1[i].b );
		ctx.fillRect( psy_stimuli1[i].rect.x ,psy_stimuli1[i].rect.y ,psy_stimuli1[i].rect.width ,psy_stimuli1[i].rect.height );
		break;
		
	    case 1: /* draw a bitmap, as setup with psy_add_centered_bitmap */
		// addlog("draw image "+psy_stimuli1[i].bitmap)
		if ( psy_stimuli1[i].R == 0 )
		    ctx.drawImage( psy_bitmaps[ psy_stimuli1[i].bitmap - 1 ] , psy_stimuli1[i].rect.x , psy_stimuli1[i].rect.y );
		else
		{
		    ctx.save();
		    ctx.translate(psy_screen_width/2,psy_screen_height/2);
		    ctx.rotate( psy_stimuli1[i].R * Math.PI/1800 );
		    ctx.drawImage( psy_bitmaps[ psy_stimuli1[i].bitmap - 1 ] , psy_stimuli1[i].rect.x - psy_screen_width/2  , psy_stimuli1[i].rect.y  - psy_screen_height/2 );
		    ctx.restore();
		}
		break;
		
            case 2: /* draw a text, as setup with psy_add_text_rgb ; the image is drawn */
		ctx.drawImage( psy_stimuli1[ i ].text , psy_stimuli1[i].rect.x , psy_stimuli1[i].rect.y );
		break;

	    case 3: /* draw a circle, added to 2.2.1 */
		// http://www.html5canvastutorials.com/tutorials/html5-canvas-circles/
		ctx.fillStyle = hexrgb( psy_stimuli1[i].r,psy_stimuli1[i].g,psy_stimuli1[i].b );
		ctx.beginPath();
		// note that x/y should be center of the screen rectangle, which is different from rectanlge presentation
		ctx.arc( psy_stimuli1[i].rect.x + psy_stimuli1[i].rect.width / 2 ,
			 psy_stimuli1[i].rect.y + psy_stimuli1[i].rect.height / 2,
			 psy_stimuli1[i].rect.width / 2 , 0 , 2*Math.PI );

		// addlog("-->"+(psy_stimuli1[i].rect.x + psy_stimuli1[i].rect.width / 2))
		ctx.closePath();
		ctx.fill();
		break;
	    }
	}
	i ++ ;
    }

    /* 
    if ( psy_number_sprites > 0 )
    {
	for ( i = 0 ; i < psy_number_sprites ; i ++ )
	{
	    if ( psy_sprites[ i ].visible == 1 )
	    {
		buffer.drawImage( psy_bitmaps[ psy_sprites[ i ].bitmap - 1 ], psy_sprites[i].fg.x , psy_sprites[i].fg.y , null); 
	    }
	}
    }
    */
    //addlog("end psy_draw_all_db()")

}

function psy_add_centered_rectangle_rgb_db(  x ,  y ,  w,  h,  r,  g,  b )
{
    var tmpx; var tmpy;
    psy_stimuli1[ psy_stimuli1_end ].x = x ;
    psy_stimuli1[ psy_stimuli1_end ].y = y ;        
    psy_stimuli1[ psy_stimuli1_end ].type = 0 ; // 0 is rectangle
    psy_stimuli1[ psy_stimuli1_end ].on = 1 ;
    if ( x == PSY_CENTRAL ) tmpx = psy_screen_center_x - w / 2 ; else tmpx = x + psy_screen_x_offset - w / 2;
    if ( y == PSY_CENTRAL ) tmpy = psy_screen_center_y - h / 2 ; else tmpy = y + psy_screen_y_offset - h / 2 ;
    
    psy_stimuli1[ psy_stimuli1_end ].rect.x = tmpx ;
    psy_stimuli1[ psy_stimuli1_end ].rect.y = tmpy ;
    psy_stimuli1[ psy_stimuli1_end ].rect.width = w ;
    psy_stimuli1[ psy_stimuli1_end ].rect.height = h ;
    
    psy_stimuli1[ psy_stimuli1_end ].r = r ;
    psy_stimuli1[ psy_stimuli1_end ].g = g ;
    psy_stimuli1[ psy_stimuli1_end ].b = b ;

    psy_stimuli1_n ++ ;
    psy_stimuli1_end ++ ;
    return( psy_stimuli1_end );
}

function psy_add_centered_circle_rgb_db( x ,  y , radius, r,  g,  b )
{
    var tmpx; var tmpy;
    psy_stimuli1[ psy_stimuli1_end ].x = x ;
    psy_stimuli1[ psy_stimuli1_end ].y = y ;        
    psy_stimuli1[ psy_stimuli1_end ].type = 3 ; // 0=rectangle,1=bitmap,2=text,3=circle
    psy_stimuli1[ psy_stimuli1_end ].on = 1 ;
    if ( x == PSY_CENTRAL ) tmpx = psy_screen_center_x - radius ; else tmpx = x + psy_screen_x_offset - radius ;
    if ( y == PSY_CENTRAL ) tmpy = psy_screen_center_y - radius ; else tmpy = y + psy_screen_y_offset - radius ;
    
    psy_stimuli1[ psy_stimuli1_end ].rect.x = tmpx ;
    psy_stimuli1[ psy_stimuli1_end ].rect.y = tmpy ;
    psy_stimuli1[ psy_stimuli1_end ].rect.width = radius*2 ; 
    psy_stimuli1[ psy_stimuli1_end ].rect.height = radius*2 ;

    
    // addlog("define: x,y=["+x+","+y+"]; topleft=["+tmpx+","+tmpy+"] bottomright=["+(tmpx+radius*2)+","+(tmpy+radius*2)+"]")
    
    psy_stimuli1[ psy_stimuli1_end ].r = r ;
    psy_stimuli1[ psy_stimuli1_end ].g = g ;
    psy_stimuli1[ psy_stimuli1_end ].b = b ;

    psy_stimuli1_n ++ ;
    psy_stimuli1_end ++ ;
    return( psy_stimuli1_end );
}


function psy_add_centered_bitmap_db( number , x , y , r )
{
    var tmpx ; var tmpy;

    psy_stimuli1[ psy_stimuli1_end ].x = x ;
    psy_stimuli1[ psy_stimuli1_end ].y = y ;        
    psy_stimuli1[ psy_stimuli1_end ].R = r ;
    
    psy_stimuli1[ psy_stimuli1_end ].type = 1 ; // 1 is bitmap                                                    
    psy_stimuli1[ psy_stimuli1_end ].on = 1 ;
    psy_stimuli1[ psy_stimuli1_end ].bitmap = number ;

    if ( x == PSY_CENTRAL )
        tmpx = psy_screen_center_x - psy_bitmaps[number-1].width / 2 ;
    else
        tmpx = x + psy_screen_x_offset - psy_bitmaps[number-1].width / 2 ;
    
    if ( y == PSY_CENTRAL )
        tmpy = psy_screen_center_y - psy_bitmaps[number-1].height / 2 ;
    else
        tmpy = y + psy_screen_y_offset - psy_bitmaps[number-1].height / 2 ;
    
    psy_stimuli1[ psy_stimuli1_end ].rect.x      = tmpx ;
    psy_stimuli1[ psy_stimuli1_end ].rect.y      = tmpy ;
    psy_stimuli1[ psy_stimuli1_end ].rect.width  = psy_bitmaps[number-1].width ;
    psy_stimuli1[ psy_stimuli1_end ].rect.height = psy_bitmaps[number-1].height ;

    psy_stimuli1_n ++ ;
    psy_stimuli1_end ++ ;
    return( psy_stimuli1_end );
}

function psy_set_coordinate_system( s )
{
    // addlog("set coordinate system: "+psy_screen_x_offset )

    if ( s == 'c' ) // centerzero
    {
	psy_screen_x_offset = psy_screen_center_x ;

	//addlog("set coordinate system: "+psy_screen_x_offset )

	psy_screen_y_offset = psy_screen_center_y ;
    }

    // addlog("set coordinate system: "+psy_screen_x_offset )
}

function Rectangle()
    {
	this.x=0;
	this.y=0;
	this.w=0;
	this.h=0;
    }

function psy_stimulus1()
{
    this.on=0;
    this.type=0;
    this.r=0;
    this.g=0;
    this.b=0;
    this.a=0;
    this.bitmap=0;
    this.x=0;
    this.y=0;
    this.w=0;
    this.h=0;
    this.R=0;
    this.rect=0;
} 

var psy_stimuli1 = new Array;

for( i = 0 ; i < MAXBITMAPS ; i++ ){ psy_stimuli1[i]=new psy_stimulus1; psy_stimuli1[i].rect = new Rectangle; }

var psy_stimuli1_n = 0 ;
var psy_stimuli1_end = 0 ;

function psy_mouse_visibility( visible )
{
    if ( visible == 1 )
    {
	c.style.cursor="default";
	psy_mouse_cursor = 1 ; // this is easier than querying the style via javascript/css. This is not how it is done in C.
    }
    else
    {
	c.style.cursor="none"; // not supported in all browsers
	psy_mouse_cursor = 0 ;	
    }
}

//////////////////////////////////////////////////////////////////////
//
// EXPERIMENT SPECIFIC FUNCTIONS
//
//////////////////////////////////////////////////////////////////////

/* very close to C and Java code */

var trial_counter; var i;
var trials_left_to_do = 0 ; // this is used if there is more than one task in a block; this is for now used as globabl variable (since 1.9.3)
var tasklist_end_request = 0;
var experiment_end_request = 0;
var Timer_tasklist_begin; var Timer_tasklist_now;
var maxtasklisttime = 0;
var TRIAL_SELECTION_RANDOM = 0;
var TRIAL_SELECTION_RANDOM_NEVER_REPEAT = 1;
var TRIAL_SELECTION_FIXED_SEQUENCE = 2;
var TRIAL_SELECTION_REPEAT_ON_ERROR = 3;
var TRIAL_SELECTION_ONCE = 4;
var error_status;	

trial_counter_per_task = new Array(); // 1.9.3 DEBUG TODO: THIS IS NOW DEFINED GLOBAL AND LOCAL, NEED TO FIX
task_probability       = new Array(); // 1.9.3 DEBUG TODO: THIS IS NOW DEFINED GLOBAL AND LOCAL, NEED TO FIX

var blockname = "" ;
var blockrepeat = 1;

var current_trial = new Array();

var current_task = "" // keeps name of current task/block, which is used for jumping back after delay or key
var current_block= ""


function psy_time_since_start(){
    return( new Date().getTime() - psy_exp_start_time )
}

function psy_diff_timers( starttime , endtime ){
    return ( endtime - starttime )
}


// for use in task delays only
function psy_delay( ms ){
    setTimeout( current_task+".run();", ms )
}

// for use in block delays only
function psy_delay_block( ms ){
    setTimeout( current_block+".run();", ms )
}

/* -- psy_choose stuff --------------------------------*/

var psy_chosen_n = 0 ;
var psy_chosen_objects = [] ;

var choose = {
    first: 0, last: 0 ,
    counter1: 0, counter2: 0,
    mouse_select_bitmap: 0,
    mouse_select_bg_bitmap: 0, // TODO, WHAT IS THIS? DOES NOT SEEM NEEDED
    keep: false,
    minselect: 0, /* have to select at least this */
    maxselect: 9999, /* cannot select more than this */
    current_exit_bitmap_num: 0 , // one of two possible bitmaps
    n_selected: 0,
    exit: -1,
    exit_bitmap_1: -1,
    exit_bitmap_2: -1,
    selectedstimuli: [], /* 0 and 1s for no selection, or a number for
			  * the new overlay stimulus on top; this is
			  * the way to keep track of the number of
			  * newly created bitmaps for puting a marker
			  * on top of the selected bitmaps */
    expect_key: 0,
    timer: 0,

    getmouseclick: function( e ){
	if ( choose.expect_key == 1 ){

	    canvas_x_offset = c.getBoundingClientRect().left ;
	    canvas_y_offset = c.getBoundingClientRect().top	    

	    // NOTE: THIS NEEDS CHECKING -- DEBUG
	    tmpmouseX = e.clientX - canvas_x_offset - psy_screen_x_offset ; // in psytoolkit coordinates
            tmpmouseY = e.clientY - canvas_y_offset - psy_screen_y_offset ;

	    // is exit bitmap clicked?
	    // addlog("in choose exit "+choose.exit)

	    tmpnum = psy_bitmap_under_mouse(0,choose.current_exit_bitmap_num,choose.current_exit_bitmap_num,
					    tmpmouseX,tmpmouseY)
	    if ( tmpnum == choose.current_exit_bitmap_num &&
		 choose.n_selected >= choose.minselect &&
	         choose.n_selected <= choose.maxselect )
	    {
		choose.stop();
	    }else{
		// any bitmap other than exit under mouse?
		
		tmpnum = psy_bitmap_under_mouse(0,choose.first,choose.last,tmpmouseX,tmpmouseY)
		tmpx = psy_stimuli1[ tmpnum - 1 ].x
		tmpy = psy_stimuli1[ tmpnum - 1 ].y

		if( choose.selectedstimuli[ tmpnum ] == null ){    // it is not yet selected 
		    if ( choose.n_selected < choose.maxselect ){ // add marker
			
			choose.selectedstimuli[tmpnum] = psy_add_centered_bitmap_db( choose.mouse_select_bitmap ,
					       					     tmpx,tmpy );
			choose.n_selected ++ ;
		    }
		}else{ // it is already selected and needs to be unselected
		    psy_clear_stimuli1( choose.selectedstimuli[tmpnum] );
		    choose.selectedstimuli[ tmpnum ] = null ;
		    choose.n_selected -- ;
		}

		// now update exit button, if needed
		if ( choose.n_selected >= choose.minselect && choose.n_selected <= choose.maxselect ){ // can exit?
		    if ( choose.current_exit_bitmap_num == choose.exit_bitmap_2 ){ // this only needs to be done if exit1 is currently not on
			psy_unhide_stimuli1( choose.exit_bitmap_1 );
			psy_clear_stimuli1( choose.exit_bitmap_2 );
			choose.current_exit_bitmap_num = choose.exit_bitmap_1 ;	      
		    }
		}else{ //cannot exit based on how many objects have been selected
		    if ( choose.current_exit_bitmap_num == choose.exit_bitmap_1  ){ // this only needs to be done if exit1 is currently on
			psy_unhide_stimuli1( choose.exit_bitmap_2 );
			psy_clear_stimuli1( choose.exit_bitmap_1 );
			choose.current_exit_bitmap_num = choose.exit_bitmap_2 ;	      	      
		    }
		}
		psy_draw_all_db();
	    }
	}
    },
    timeout: function(){
	window.removeEventListener("mousedown",choose.getmouseclick,false) ; 

	// clear the exit buttons from screen (even with choose.keep==true)
	psy_clear_stimuli1( choose.exit_bitmap_1 ); // in JS, clear and hide are same
	psy_clear_stimuli1( choose.exit_bitmap_2 ); // in JS, clear and hide are same

	// if you do NOT want to keep select indicators, clear them now
	if ( !choose.keep ){
	    // now clear the stimuli drawn in this function
	    for( i = choose.first ; i < choose.last ; i ++ ){  // TODO CHECK (choose.last+1?)
		if ( choose.selectedstimuli[i] != null ){
		    psy_clear_stimuli1( choose.selectedstimuli[i] ) ;
		    // addlog( "cleared: "+choose.selectedstimuli[i] )
		}
	    }
	    psy_stimuli1_n = choose.counter1 ; // returns to the "old" value before "choose" was run
	    psy_stimuli1_end = choose.counter2 ; // returns to the "old" value before "choose" was run	
	}

        psy_draw_all_db();
	choose.expect_key = 0 ;
	choose.maxselect = 9999 ; // set back to its original high value
	// replace eval(current_task+".run()")
	setTimeout( current_task+".run()" , 0 )
    },
    stop: function(){ // stop is like timeout, except for switching of the timer
	keystatus.time = new Date().getTime() - choose.starttime ;
	psy_chosen_n = 0;
	psy_chosen_objects = Array(100).fill(0); //most unlikely more than 100 per trial
	for( i=choose.first ; i <= choose.last ; i++ ){ // TODO: CHECK IF THIS IS < or <=
	    if ( choose.selectedstimuli[i] != null ){
		psy_chosen_objects[ psy_chosen_n ] = i ;
		psy_chosen_n ++ ;
	    }
	}
        clearTimeout(choose.timer);
	choose.timeout() ; // now do rest of timeout, including removing just drawn stimuli
    }
}

function psy_choose( maxtime , stimulus_first , stimulus_last , exit1 , exit2 , exit_x, exit_y ){
    // what is the state of stimuli shown now (for later restoration of this state)
    choose.counter1 = psy_stimuli1_n ;
    choose.counter2 = psy_stimuli1_end ;
    // setup the exit bitmaps
    choose.exit_bitmap_1 = psy_add_centered_bitmap_db( exit1 , exit_x , exit_y );
    choose.exit_bitmap_2 = psy_add_centered_bitmap_db( exit2 , exit_x , exit_y );
    psy_clear_stimuli1( choose.exit_bitmap_1 ); // in JS, clear and hide are same
    psy_clear_stimuli1( choose.exit_bitmap_2 ); // in JS, clear and hide are same
    // set some parameters
    choose.expect_key = 1 ;
    choose.n_selected = 0 ;
    choose.first = stimulus_first ;
    choose.last = stimulus_last ;
    choose.selectedstimuli = [] ; /* needs to be cleared */

    /* "unhide" correct exit bitmap */
    if ( choose.n_selected >= choose.minselect && choose.n_selected <= choose.maxselect ){
	psy_unhide_stimuli1( choose.exit_bitmap_1 );
	choose.current_exit_bitmap_num = choose.exit_bitmap_1 ;
    }else{
	psy_unhide_stimuli1( choose.exit_bitmap_2 );
	choose.current_exit_bitmap_num = choose.exit_bitmap_2 ;    
    }
    psy_draw_all_db();
    window.addEventListener("mousedown",choose.getmouseclick,false)
    choose.timer = setTimeout( "choose.timeout()", maxtime); 
    choose.starttime = new Date().getTime()
}

/* -- some plotting functions used in psycc feedback functions ---------------- */

function psy_scale_point_x ( x , realx , realw , xlim1 , xlim2 ){
    xlimrange = xlim2 - xlim1 ;
    rangefactor = realw / xlimrange ; /* how much space per point */
    
    return( realx + ( x - xlim1 ) * rangefactor );
}

function psy_scale_point_y ( y , realy, realh , ylim1 , ylim2 ){
    ylimrange = ylim2 - ylim1 ;
    rangefactor =  realh / ylimrange ; /* how much space per point */
    
    // point 0 is realy+realh
    return( ( realy + realh ) - (y-ylim1) *rangefactor )
}

// the feedback part has its own small paletter of colors 
function psy_palette( colornumber ){
    switch( colornumber )
    {
	case 1: color = "white" ; break; /* white  */
	case 2: color = "red"   ; break; /* red    */
	case 3: color = "green" ; break; /* green  */
	case 4: color = "yellow"; break; /* yellow */
	case 5: color = "blue"  ; break; /* blue   */
    }
    return( color );
}

function psy_plot_xaxis(x, y, w, xlim1, xlim2 ) {
    var i;

    for (i = xlim1; i < xlim2; i++) {
        if (i % 100 == 0) {
            ctx.fillStyle = "white"
            ctx.font = "12px Arial"
            ctx.fillText(i, psy_scale_point_x(i, x, w, xlim1, xlim2) - 10, y + 20)

            ctx.beginPath()
            ctx.moveTo(psy_scale_point_x(i, x, w, xlim1, xlim2), y)
            ctx.lineTo(psy_scale_point_x(i, x, w, xlim1, xlim2), y + 8)
            ctx.stroke()
        } else { // just tickmark
            if (i % 10 == 0) {
                ctx.beginPath()
                ctx.moveTo(psy_scale_point_x(i, x, w, xlim1, xlim2), y)
                ctx.lineTo(psy_scale_point_x(i, x, w, xlim1, xlim2), y + 4)
                ctx.stroke()
            }
        }
    }

}

function psy_plot_yaxis(x, y, w, ylim1, ylim2 ) {
    var i;

    for (i = ylim1; i < ylim2; i++) {
        if (i % 50 == 0) {
            ctx.fillStyle = "white"
            ctx.font = "12px Arial"
            // NOTE the +5 below should actually be improved, because it just is an adjustment
            // for the offset between the letter and the tickmark
            ctx.fillText(i, x - 30, psy_scale_point_y(i, y, w, ylim1, ylim2) + 3)

            ctx.beginPath()
            ctx.moveTo(x - 8, psy_scale_point_y(i, y, w, ylim1, ylim2))
            ctx.lineTo(x, psy_scale_point_y(i, y, w, ylim1, ylim2))
            ctx.stroke()
        } else {
            if (i % 10 == 0) {
                ctx.beginPath()
                ctx.moveTo(x - 4, psy_scale_point_y(i, y, w, ylim1, ylim2))
                ctx.lineTo(x, psy_scale_point_y(i, y, w, ylim1, ylim2))
                ctx.stroke()
            }
        }
    }
}

// e.g., psy_plot_circle(100,100,10,"#FF0000")
function psy_plot_circle( x , y , radius , colorname ){
    ctx.fillStyle = colorname
    ctx.beginPath()
    ctx.arc( x , y , radius , 0 , 2*Math.PI )
    ctx.closePath()
    ctx.fill()
}

// psy_xyplot
// currently ignore box and col

// we need a number sort function, which we then need to use in sort
// in psy_xyplot

function numsort( a , b ){ return( a - b ) ; }
function minimum( a ){ tmp=a.slice();return( tmp.sort(numsort)[0] ) }
function maximum( a ){ tmp=a.slice();return( tmp.sort(numsort)[tmp.length-1] ) }

function psy_xyplot(x, y, w, h, box, col, xdata, ydata, xlabel, ylabel) {

    // set x and y lim and enlarge data points
    // available for plotting should include 
    // sides, so that the actual pixels will fit in
    xlim1 = minimum(xdata) - 10 //you must use minimum, e.g., because .sort
    //changes actual array, rather than
    //returning a new array
    xlim2 = maximum(xdata) + 10
    ylim1 = minimum(ydata) - 10
    ylim2 = maximum(ydata) + 10

    // plot each point
    for (i = 0; i < xdata.length; i++) {
        psy_plot_circle(psy_scale_point_x(xdata[i], x, w, xlim1, xlim2),
			psy_scale_point_y(ydata[i], y, h, ylim1, ylim2), 4, psy_palette(col));
    }

    // plot box around the points
    // ctx.strokeStyle( psy_palette( col ) )
    ctx.beginPath()
    ctx.strokeStyle = psy_palette(col)
    ctx.rect(x, y, w, h)
    ctx.stroke()

    psy_plot_xaxis(x, y + h, w, xlim1, xlim2 );
    psy_plot_yaxis(x, y, h, ylim1, ylim2 );

    // now plot the labels
    ctx.fillStyle = "white"
    ctx.font = "12px Arial"
    ctx.fillText(xlabel, x + w / 2, y + h + 30)

    ctx.save();
    ctx.translate(x - 50 , y + h/2 );
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText( ylabel , 0 , 0);
    ctx.restore();
}

// in a line plot, there are only y coordinates, plotted from 1 to length of array
function psy_lineplot(   x ,  y ,  w ,  h ,  box ,  ydata ,  colors ,  xlabel , ylabel ){

    xlim1 = 1               - 5
    xlim2 = ydata.length    + 5
    ylim1 = minimum(ydata)  - 10
    ylim2 = maximum(ydata)  + 10

    // plot each point, and lines between them

    previousx = 0
    previousy = 0
    for (i = 0; i < ydata.length; i++) {
	tmpx = psy_scale_point_x(  i, x, w, xlim1, xlim2)
	tmpy = psy_scale_point_y(  ydata[i], y , h , ylim1 , ylim2 )
        psy_plot_circle( tmpx , tmpy , 4, psy_palette(colors[i]));

	if ( i > 0 ){
	    ctx.strokeStyle="white"
	    ctx.beginPath()
	    ctx.moveTo( previousx , previousy )
	    ctx.lineTo( tmpx , tmpy )
	    ctx.stroke()
	}
	previousx = tmpx
	previousy = tmpy
    }

    // plot box around the points
    // ctx.strokeStyle( psy_palette( col ) )
    ctx.beginPath()
    ctx.strokeStyle = "white"
    ctx.rect(x, y, w, h)
    ctx.stroke()

    psy_plot_xaxis(x, y + h, w, xlim1, xlim2 );
    psy_plot_yaxis(x, y, h, ylim1, ylim2 );

    // now plot the labels
    ctx.fillStyle = "white"
    ctx.font = "12px Arial"
    ctx.fillText(xlabel, x + w / 2, y + h + 30)

    ctx.save();
    ctx.translate(x - 50 , y + h/2 );
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText( ylabel , 0 , 0);
    ctx.restore();
}

/* -- end of plotting functions used in psycc feedback functions ---------------- */

/* -- fullscreen functions (not necessary in C, currently as of version 2.0.11 */

// note: Safari does not allow fullscreen+keyboard

function psy_fullscreen( o ){ /* is object to be made fullscreen, should be canvasbox */
    if(o.requestFullScreen) o.requestFullScreen()
    else if(o.webkitRequestFullScreen) o.webkitRequestFullScreen(c.ALLOW_KEYBOARD_INPUT) /* note c is global var for canvas object */
    else if(o.mozRequestFullScreen) o.mozRequestFullScreen()
    else if(o.msRequestFullscreen)o.msRequestFullscreen();
}

function psy_exit_fullscreen(){
    if(document.exitFullScreen) document.exitFullScreen();
    else if(document.webkitCancelFullScreen)document.webkitCancelFullScreen();
    else if(document.mozCancelFullScreen)document.mozCancelFullScreen();
    else if(document.msExitFullscreen)document.msExitFullscreen();
}

/* ---------------------------------------------- */

function psy_rotate_existing_stimulus( number , r ){
    if ( number < 0 )
	tmp = psy_stimuli1_end + number ;
    else
	tmp = number - 1;

    psy_stimuli1[ tmp ].R = r ;
}

/* --------------------------------------------- */
/* All rate (rating scale) code                  */
/* similarly programmed as psy_choose            */

var rate = {
    first: 0, last: 0 , // the first and last item on scale
    rt: 0, status: 0, selected: -1,
    counter1: 0, counter2: 0, // storage for psy_stimuli1_n and psy_stimuli_end
    //mouse_select_bitmap: 0,
    //mouse_select_bg_bitmap: 0, // TODO, WHAT IS THIS? DOES NOT SEEM NEEDED
    keep: false,
    exit: -1,
    left_bitmap: 0,
    right_bitmap: 0,
    item_bitmap: 0,
    between_px: 20,
    expect_key: 0,
    timer: 0,

    getmouseclick: function( e ){
	if ( rate.expect_key == 1 ){

	    canvas_x_offset = c.getBoundingClientRect().left ;
	    canvas_y_offset = c.getBoundingClientRect().top	    

	    // NOTE: THIS NEEDS CHECKING -- DEBUG
	    tmpmouseX = e.clientX - canvas_x_offset - psy_screen_x_offset ; // in psytoolkit coordinates
            tmpmouseY = e.clientY - canvas_y_offset - psy_screen_y_offset ;

	    tmpnum = psy_bitmap_under_mouse(0,rate.first,rate.last,tmpmouseX,tmpmouseY)
	    tmpx = psy_stimuli1[ tmpnum - 1 ].x
	    tmpy = psy_stimuli1[ tmpnum - 1 ].y

	    if ( tmpnum >= rate.first && tmpnum <= rate.last )
	    {
		rate.selected = tmpnum - rate.first + 1
		rate.expect_key = 0 ;
		rate.stop();
	    }
	}
    },
    timeout: function(){
	window.removeEventListener("mousedown",rate.getmouseclick,false) ; 
	if ( !rate.keep ){
	    // now clear the stimuli drawn in this function
	    for( i = (rate.counter2+1) ; i <= rate.last ; i ++ ){
		psy_clear_stimuli1( i ) ;
	    }
	    psy_stimuli1_n = rate.counter1 ; // returns to the "old" value before "rate" was run
	    psy_stimuli1_end = rate.counter2 ; // returns to the "old" value before "rate" was run	
	}

        psy_draw_all_db();
	rate.expect_key = 0 ;
	psy_restore_mouse();
	setTimeout( current_task+".run()" , 0 )
    },
    stop: function(){ // stop is like timeout, except for switching off the timer
	rate.rt = new Date().getTime() - rate.starttime ;
	rate.status = 1 ;
        clearTimeout(rate.timer);
	rate.timeout() ; // now do rest of timeout, including removing just drawn stimuli
    }
}

function psy_rate_go( xpos , ypos , maxtime , items ){
    // set default values
    rate.rt = 0 ; // default is 0
    rate.selected = -1 ;
    rate.status = 3 ; // default is timeout, unless set to 1 by rate::stop()
    // make sure mouse is on
    psy_store_mouse();
    psy_mouse_visibility(1);
    // what is the state of stimuli shown now (for later restoration of this state)
    rate.counter1 = psy_stimuli1_n ;
    rate.counter2 = psy_stimuli1_end ;
    /* calculate dimensions of rate scale on screen */
    // width of items itself, depends on whether default of user bitmaps are used
    if ( rate.item_bitmap == 0 ){
	itemwidth=20 // radius of circle 20 is set below
    }else{
	itemwidth=psy_bitmaps[rate.item_bitmap-1].width
    }

    if ( rate.left_bitmap == 0 ){
	scaleW = itemwidth*items + rate.between_px * (items-1)
    }else{
	scaleW = itemwidth*items + rate.between_px * (items-1)
    }

    /* show rating scale on the screen */
    /* the left and right bitmaps */
    if ( rate.left_bitmap == 0 ){
  	psy_add_centered_rectangle_rgb_db( xpos - (scaleW/2 + 15 + rate.between_px),
					   ypos , 30 , 30 ,  255,255,255 );
	psy_add_centered_rectangle_rgb_db( xpos + scaleW/2 + 15 + rate.between_px ,
					   ypos , 30 , 30 ,  255,255,255 );
    }else{
	psy_add_centered_bitmap_db( rate.left_bitmap ,
				    xpos - (scaleW/2 + psy_bitmaps[rate.left_bitmap-1].width/2 + rate.between_px), ypos , 0 );
	psy_add_centered_bitmap_db( rate.right_bitmap ,
				    xpos + scaleW/2 + psy_bitmaps[rate.right_bitmap-1].width/2 + rate.between_px, ypos , 0 );
    }

    /* show the different points on the scale */
    rate.first = psy_stimuli1_end + 1 ;
    for( i = 0 ; i < items ; i++ ){
	if ( rate.item_bitmap == 0 ){
	    psy_add_centered_circle_rgb_db( xpos-(scaleW/2)+i*(rate.between_px+itemwidth)+itemwidth/2 , ypos , 10 , 255,255,0)
	}else{
	    psy_add_centered_bitmap_db( rate.item_bitmap ,
					xpos-(scaleW/2)+i*(rate.between_px+itemwidth)+itemwidth/2 , ypos ,0 );
	}
    }
    rate.last = psy_stimuli1_end ;
    psy_draw_all_db();

    /* now that is all on the screen, handle the mouse */

    rate.expect_key = 1 ; /* keep track if mouse has been clicked on item */

    window.addEventListener("mousedown",rate.getmouseclick,false);
    rate.timer = setTimeout( "rate.timeout()", maxtime); 
    rate.starttime = new Date().getTime();
}

//////////////////////////////////////////////////////////////////////
// following two functions just to start online experiment
// TODO TO TEST 1/5/2018

function start_exp_setup(){
    // rectangle width= 450x350
        topX = psy_screen_width  - (psy_screen_width / 2)  - 450/2
        topY = psy_screen_height - (psy_screen_height / 2) - 350/2
        botX = psy_screen_width  - (psy_screen_width / 2)  + 450/2
        botY = psy_screen_height - (psy_screen_height / 2) + 350/2
    //

    tmp1 = document.getElementById('exp')
    tmp2 = tmp1.getContext('2d')
    tmp2.fillStyle='red'
    tmp2.fillRect(topX,topY,450,350)
    tmp2.fillStyle='yellow'
    tmp2.font='24px Arial'
    tmp2.textAlign='center'

    // note: psy_startbutton_text will be set in psycc (but have some insurance)
    if ( !psy_startbutton_text ) psy_startbutton_text = "Click to start ..." ;

    tmp2.fillText(psy_startbutton_text,psy_screen_width/2,psy_screen_height/2)

    // TODO: note, the tmpmouse function is created in survey-classes.rb
    // in the future, you might also define it here
    window.addEventListener('mousedown', tmpmouse, false); ScreenStartTime=new Date().getTime();
}
var intro = 1 ;
var selector = 2 ;
var arial = 0 ;

/* global variables in tasks, blocks, and feedback */
var reactTime = 0 ; /* set in options section */
var dislikeLike = 0 ; /* set in options section */
var falseTrue = 0 ; /* set in options section */
var elabScenario = 0 ; /* set in options section */
var psy_startbutton_text = "Click to start";
/* global timestamp variables in tasks */
var general_trial_counter = 0 ;
var selectedoncecount_table_elabInstr = 0;
function elabInstrtype ( x1, xselected ){
this.c1 = x1;
this.selected=xselected;
}
var elabInstr = [
new elabInstrtype( "This is a high elaboration scenario.",0),
new elabInstrtype( "This is a low elaboration scenario.",0),
];
var selectedoncecount_table_dentolStatements = 0;
function dentolStatementstype ( x1, xselected ){
this.c1 = x1;
this.selected=xselected;
}
var dentolStatements = [
new dentolStatementstype( "Dentol toothpaste fights gum disease.",0),
new dentolStatementstype( "Dentol toothpaste kills germs that cause bad breath.",0),
new dentolStatementstype( "Dentol toothpaste prevents cavities.",0),
];
var selectedoncecount_table_dentolAdjectives = 0;
function dentolAdjectivestype ( x1 , x2 , x3, xselected ){
this.c1 = x1;
this.c2 = x2;
this.c3 = x3;
this.selected=xselected;
}
var dentolAdjectives = [
new dentolAdjectivestype( "Dentol toothpaste.", "Dislike", "Like",0),
new dentolAdjectivestype( "Dentol toothpaste.", "Positive", "Negative",0),
new dentolAdjectivestype( "Dentol toothpaste.", "Good", "Bad",0),
];
var selectedoncecount_table_coverStatements = 0;
function coverStatementstype ( x1, xselected ){
this.c1 = x1;
this.selected=xselected;
}
var coverStatements = [
new coverStatementstype( "BrandX fights gum disease.",0),
new coverStatementstype( "BrandX kills germs that cause bad breath.",0),
new coverStatementstype( "BrandY prevents cavities.",0),
];
var selectedoncecount_table_coverAdjectives = 0;
function coverAdjectivestype ( x1 , x2 , x3, xselected ){
this.c1 = x1;
this.c2 = x2;
this.c3 = x3;
this.selected=xselected;
}
var coverAdjectives = [
new coverAdjectivestype( "BrandX.", "Dislike", "Like",0),
new coverAdjectivestype( "BrandX.", "Positive", "Negative",0),
new coverAdjectivestype( "BrandY.", "Good", "Bad",0),
];


/* TASK: elabInstr -------------------*/
var task_elabInstr = { step:1, task_trial_selection:0, current_trial: -1, taskname: "task_elabInstr",tasknumber:1,
start: function(trial_selection){task_elabInstr.trial_selection=trial_selection; task_elabInstr.step=1;
psy_clear_stimulus_counters_db();task_elabInstr.run();},
run: function(){
current_task = task_elabInstr.taskname ; 
switch( task_elabInstr.step ){
case 1:
task_elabInstr.step++;
general_trial_counter++ ;
if ( task_elabInstr.trial_selection == TRIAL_SELECTION_RANDOM ){
tablerow = psy_random( 0 , 1 )
task_elabInstr.current_trial = tablerow ; }
if ( task_elabInstr.trial_selection == TRIAL_SELECTION_RANDOM_NEVER_REPEAT ){
 tablerow = psy_random( 0 , 1 ); 
 while( tablerow == task_elabInstr.current_trial )
   tablerow = psy_random( 0 , 1 );
 task_elabInstr.current_trial = tablerow ; } 
if ( task_elabInstr.trial_selection == TRIAL_SELECTION_FIXED_SEQUENCE ){
task_elabInstr.current_trial++;
 if ( task_elabInstr.current_trial == 2 ) task_elabInstr.current_trial = 0 ;
 tablerow = task_elabInstr.current_trial;}
if ( task_elabInstr.trial_selection == TRIAL_SELECTION_REPEAT_ON_ERROR ){
if (error_status!=0 && task_elabInstr.current_trial != -1 ){tablerow = task_elabInstr.current_trial }else{
tablerow = psy_random( 0 , 1 )
task_elabInstr.current_trial = tablerow ; }}
if ( task_elabInstr.trial_selection == TRIAL_SELECTION_ONCE ){
/* if all trials have been selected, set all selected fields of table to zero */
if(selectedoncecount_table_elabInstr == 2 ){
for(tmptr=0;tmptr<2;tmptr++)
elabInstr[tmptr].selected = 0;
selectedoncecount_table_elabInstr = 0;
} /*end of if selectedoncecount */
 tablerow = psy_random( 0 ,1 ); 
 while( elabInstr[tablerow].selected == 1 || tablerow == task_elabInstr.current_trial )
 tablerow = psy_random( 0 ,1 ); 
task_elabInstr.current_trial = tablerow ; 
selectedoncecount_table_elabInstr++;
elabInstr[tablerow].selected = 1;} /*end of TRIAL_SELECTED_ONCE */
error_status=0; /* because there is a table, this must be after table TRIAL SELECTION stuff */
psy_add_text_rgb_db( arial, 0,0, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, elabInstr[tablerow].c1 , 0 );
psy_draw_all_db();
elabScenario = (tablerow+1) ; 
psy_delay( 5000 );
break;
case 2:
task_elabInstr.step++;
setTimeout(current_block+".run()",0)
break;
}}}


/* TASK: coverInstr -------------------*/
var task_coverInstr = { step:1, task_trial_selection:0, current_trial: -1, taskname: "task_coverInstr",tasknumber:2,
start: function(trial_selection){task_coverInstr.trial_selection=trial_selection; task_coverInstr.step=1;
psy_clear_stimulus_counters_db();task_coverInstr.run();},
run: function(){
current_task = task_coverInstr.taskname ; 
switch( task_coverInstr.step ){
case 1:
task_coverInstr.step++;
general_trial_counter++ ;
error_status = 0 ; /* necessary only if error option is used */
psy_add_text_rgb_db( arial, 0,0, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, "Describe that misc brands will be tested." , 0 );
psy_draw_all_db();
psy_delay( 5000 );
break;
case 2:
task_coverInstr.step++;
setTimeout(current_block+".run()",0)
break;
}}}


/* TASK: dentolInstr -------------------*/
var task_dentolInstr = { step:1, task_trial_selection:0, current_trial: -1, taskname: "task_dentolInstr",tasknumber:3,
start: function(trial_selection){task_dentolInstr.trial_selection=trial_selection; task_dentolInstr.step=1;
psy_clear_stimulus_counters_db();task_dentolInstr.run();},
run: function(){
current_task = task_dentolInstr.taskname ; 
switch( task_dentolInstr.step ){
case 1:
task_dentolInstr.step++;
general_trial_counter++ ;
error_status = 0 ; /* necessary only if error option is used */
psy_add_text_rgb_db( arial, 0,0, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, "Describe that our brand will be tested." , 0 );
psy_draw_all_db();
psy_delay( 5000 );
break;
case 2:
task_dentolInstr.step++;
setTimeout(current_block+".run()",0)
break;
}}}


/* TASK: thankYouMessage -------------------*/
var task_thankYouMessage = { step:1, task_trial_selection:0, current_trial: -1, taskname: "task_thankYouMessage",tasknumber:4,
start: function(trial_selection){task_thankYouMessage.trial_selection=trial_selection; task_thankYouMessage.step=1;
psy_clear_stimulus_counters_db();task_thankYouMessage.run();},
run: function(){
current_task = task_thankYouMessage.taskname ; 
switch( task_thankYouMessage.step ){
case 1:
task_thankYouMessage.step++;
general_trial_counter++ ;
error_status = 0 ; /* necessary only if error option is used */
psy_add_text_rgb_db( arial, 0,0, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, "Thanks for participating in our study!" , 0 );
psy_draw_all_db();
psy_delay( 5000 );
break;
case 2:
task_thankYouMessage.step++;
setTimeout(current_block+".run()",0)
break;
}}}


/* TASK: dentolMessage -------------------*/
var task_dentolMessage = { step:1, task_trial_selection:0, current_trial: -1, taskname: "task_dentolMessage",tasknumber:5,
start: function(trial_selection){task_dentolMessage.trial_selection=trial_selection; task_dentolMessage.step=1;
psy_clear_stimulus_counters_db();task_dentolMessage.run();},
run: function(){
current_task = task_dentolMessage.taskname ; 
switch( task_dentolMessage.step ){
case 1:
task_dentolMessage.step++;
general_trial_counter++ ;
error_status = 0 ; /* necessary only if error option is used */
psy_add_text_rgb_db( arial, 0,-80, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, "Dentol toothpaste." , 0 );
psy_draw_all_db();
psy_add_text_rgb_db( arial, 0,0, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, "Fights gum disease." , 0 );
psy_draw_all_db();
psy_add_text_rgb_db( arial, 0,40, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, "Kills germs that cause bad breath." , 0 );
psy_draw_all_db();
psy_add_text_rgb_db( arial, 0,80, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, "Prevents cavities." , 0 );
psy_draw_all_db();
psy_delay( 5000 );
break;
case 2:
task_dentolMessage.step++;
setTimeout(current_block+".run()",0)
break;
}}}


/* TASK: coverStatements -------------------*/
var task_coverStatements = { step:1, task_trial_selection:0, current_trial: -1, taskname: "task_coverStatements",tasknumber:6,
start: function(trial_selection){task_coverStatements.trial_selection=trial_selection; task_coverStatements.step=1;
psy_clear_stimulus_counters_db();task_coverStatements.run();},
mouseX: 0,
mouseY: 0,
run: function(){
current_task = task_coverStatements.taskname ; 
switch( task_coverStatements.step ){
case 1:
task_coverStatements.step++;
general_trial_counter++ ;
task_coverStatements.mouseX = task_coverStatements.mouseY = 0 ; /* init local variables */
if ( task_coverStatements.trial_selection == TRIAL_SELECTION_RANDOM ){
tablerow = psy_random( 0 , 2 )
task_coverStatements.current_trial = tablerow ; }
if ( task_coverStatements.trial_selection == TRIAL_SELECTION_RANDOM_NEVER_REPEAT ){
 tablerow = psy_random( 0 , 2 ); 
 while( tablerow == task_coverStatements.current_trial )
   tablerow = psy_random( 0 , 2 );
 task_coverStatements.current_trial = tablerow ; } 
if ( task_coverStatements.trial_selection == TRIAL_SELECTION_FIXED_SEQUENCE ){
task_coverStatements.current_trial++;
 if ( task_coverStatements.current_trial == 3 ) task_coverStatements.current_trial = 0 ;
 tablerow = task_coverStatements.current_trial;}
if ( task_coverStatements.trial_selection == TRIAL_SELECTION_REPEAT_ON_ERROR ){
if (error_status!=0 && task_coverStatements.current_trial != -1 ){tablerow = task_coverStatements.current_trial }else{
tablerow = psy_random( 0 , 2 )
task_coverStatements.current_trial = tablerow ; }}
if ( task_coverStatements.trial_selection == TRIAL_SELECTION_ONCE ){
/* if all trials have been selected, set all selected fields of table to zero */
if(selectedoncecount_table_coverStatements == 3 ){
for(tmptr=0;tmptr<3;tmptr++)
coverStatements[tmptr].selected = 0;
selectedoncecount_table_coverStatements = 0;
} /*end of if selectedoncecount */
 tablerow = psy_random( 0 ,2 ); 
 while( coverStatements[tablerow].selected == 1 || tablerow == task_coverStatements.current_trial )
 tablerow = psy_random( 0 ,2 ); 
task_coverStatements.current_trial = tablerow ; 
selectedoncecount_table_coverStatements++;
coverStatements[tablerow].selected = 1;} /*end of TRIAL_SELECTED_ONCE */
error_status=0; /* because there is a table, this must be after table TRIAL SELECTION stuff */
psy_clear_screen_db();
psy_mouse_visibility( 1 );
psy_add_centered_bitmap_db( selector,-100,40,0);
psy_draw_all_db();
psy_add_centered_bitmap_db( selector,100,40,0);
psy_draw_all_db();
psy_add_text_rgb_db( arial, 0,-80, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, coverStatements[tablerow].c1 , 0 );
psy_draw_all_db();
psy_add_text_rgb_db( arial, -100,40, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, "False" , 0 );
psy_draw_all_db();
psy_add_text_rgb_db( arial, 100,40, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, "True" , 0 );
psy_draw_all_db();
psy_mouse_click_bitmap_rectangle( 'l',1,10000);
break;
case 2:
task_coverStatements.step++;
task_coverStatements.mouseX = keystatus.mouse_x ; 
task_coverStatements.mouseY = keystatus.mouse_y ; 
falseTrue=psy_bitmap_under_mouse(0,-1,-1,task_coverStatements.mouseX,task_coverStatements.mouseY);
falseTrue = keystatus.time ; 
addoutput(elabScenario+' '+"coverStatements"+' '+(tablerow+1)+' '+general_trial_counter+' '+keystatus.time+' '+falseTrue);
setTimeout(current_block+".run()",0)
break;
}}}


/* TASK: coverAdjectives -------------------*/
var task_coverAdjectives = { step:1, task_trial_selection:0, current_trial: -1, taskname: "task_coverAdjectives",tasknumber:7,
start: function(trial_selection){task_coverAdjectives.trial_selection=trial_selection; task_coverAdjectives.step=1;
psy_clear_stimulus_counters_db();task_coverAdjectives.run();},
mouseX: 0,
mouseY: 0,
run: function(){
current_task = task_coverAdjectives.taskname ; 
switch( task_coverAdjectives.step ){
case 1:
task_coverAdjectives.step++;
general_trial_counter++ ;
task_coverAdjectives.mouseX = task_coverAdjectives.mouseY = 0 ; /* init local variables */
if ( task_coverAdjectives.trial_selection == TRIAL_SELECTION_RANDOM ){
tablerow = psy_random( 0 , 2 )
task_coverAdjectives.current_trial = tablerow ; }
if ( task_coverAdjectives.trial_selection == TRIAL_SELECTION_RANDOM_NEVER_REPEAT ){
 tablerow = psy_random( 0 , 2 ); 
 while( tablerow == task_coverAdjectives.current_trial )
   tablerow = psy_random( 0 , 2 );
 task_coverAdjectives.current_trial = tablerow ; } 
if ( task_coverAdjectives.trial_selection == TRIAL_SELECTION_FIXED_SEQUENCE ){
task_coverAdjectives.current_trial++;
 if ( task_coverAdjectives.current_trial == 3 ) task_coverAdjectives.current_trial = 0 ;
 tablerow = task_coverAdjectives.current_trial;}
if ( task_coverAdjectives.trial_selection == TRIAL_SELECTION_REPEAT_ON_ERROR ){
if (error_status!=0 && task_coverAdjectives.current_trial != -1 ){tablerow = task_coverAdjectives.current_trial }else{
tablerow = psy_random( 0 , 2 )
task_coverAdjectives.current_trial = tablerow ; }}
if ( task_coverAdjectives.trial_selection == TRIAL_SELECTION_ONCE ){
/* if all trials have been selected, set all selected fields of table to zero */
if(selectedoncecount_table_coverAdjectives == 3 ){
for(tmptr=0;tmptr<3;tmptr++)
coverAdjectives[tmptr].selected = 0;
selectedoncecount_table_coverAdjectives = 0;
} /*end of if selectedoncecount */
 tablerow = psy_random( 0 ,2 ); 
 while( coverAdjectives[tablerow].selected == 1 || tablerow == task_coverAdjectives.current_trial )
 tablerow = psy_random( 0 ,2 ); 
task_coverAdjectives.current_trial = tablerow ; 
selectedoncecount_table_coverAdjectives++;
coverAdjectives[tablerow].selected = 1;} /*end of TRIAL_SELECTED_ONCE */
error_status=0; /* because there is a table, this must be after table TRIAL SELECTION stuff */
psy_clear_screen_db();
psy_mouse_visibility( 1 );
psy_add_centered_bitmap_db( selector,-100,40,0);
psy_draw_all_db();
psy_add_centered_bitmap_db( selector,100,40,0);
psy_draw_all_db();
psy_add_text_rgb_db( arial, 0,-80, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, coverAdjectives[tablerow].c1 , 0 );
psy_draw_all_db();
psy_add_text_rgb_db( arial, -100,40, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, coverAdjectives[tablerow].c2 , 0 );
psy_draw_all_db();
psy_add_text_rgb_db( arial, 100,40, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, coverAdjectives[tablerow].c3 , 0 );
psy_draw_all_db();
psy_mouse_click_bitmap_rectangle( 'l',1,10000);
break;
case 2:
task_coverAdjectives.step++;
task_coverAdjectives.mouseX = keystatus.mouse_x ; 
task_coverAdjectives.mouseY = keystatus.mouse_y ; 
dislikeLike=psy_bitmap_under_mouse(0,-1,-1,task_coverAdjectives.mouseX,task_coverAdjectives.mouseY);
reactTime = keystatus.time ; 
addoutput(elabScenario+' '+"coverAdjectives"+' '+(tablerow+1)+' '+general_trial_counter+' '+keystatus.time+' '+dislikeLike);
setTimeout(current_block+".run()",0)
break;
}}}


/* TASK: dentolStatements -------------------*/
var task_dentolStatements = { step:1, task_trial_selection:0, current_trial: -1, taskname: "task_dentolStatements",tasknumber:8,
start: function(trial_selection){task_dentolStatements.trial_selection=trial_selection; task_dentolStatements.step=1;
psy_clear_stimulus_counters_db();task_dentolStatements.run();},
mouseX: 0,
mouseY: 0,
run: function(){
current_task = task_dentolStatements.taskname ; 
switch( task_dentolStatements.step ){
case 1:
task_dentolStatements.step++;
general_trial_counter++ ;
task_dentolStatements.mouseX = task_dentolStatements.mouseY = 0 ; /* init local variables */
if ( task_dentolStatements.trial_selection == TRIAL_SELECTION_RANDOM ){
tablerow = psy_random( 0 , 2 )
task_dentolStatements.current_trial = tablerow ; }
if ( task_dentolStatements.trial_selection == TRIAL_SELECTION_RANDOM_NEVER_REPEAT ){
 tablerow = psy_random( 0 , 2 ); 
 while( tablerow == task_dentolStatements.current_trial )
   tablerow = psy_random( 0 , 2 );
 task_dentolStatements.current_trial = tablerow ; } 
if ( task_dentolStatements.trial_selection == TRIAL_SELECTION_FIXED_SEQUENCE ){
task_dentolStatements.current_trial++;
 if ( task_dentolStatements.current_trial == 3 ) task_dentolStatements.current_trial = 0 ;
 tablerow = task_dentolStatements.current_trial;}
if ( task_dentolStatements.trial_selection == TRIAL_SELECTION_REPEAT_ON_ERROR ){
if (error_status!=0 && task_dentolStatements.current_trial != -1 ){tablerow = task_dentolStatements.current_trial }else{
tablerow = psy_random( 0 , 2 )
task_dentolStatements.current_trial = tablerow ; }}
if ( task_dentolStatements.trial_selection == TRIAL_SELECTION_ONCE ){
/* if all trials have been selected, set all selected fields of table to zero */
if(selectedoncecount_table_dentolStatements == 3 ){
for(tmptr=0;tmptr<3;tmptr++)
dentolStatements[tmptr].selected = 0;
selectedoncecount_table_dentolStatements = 0;
} /*end of if selectedoncecount */
 tablerow = psy_random( 0 ,2 ); 
 while( dentolStatements[tablerow].selected == 1 || tablerow == task_dentolStatements.current_trial )
 tablerow = psy_random( 0 ,2 ); 
task_dentolStatements.current_trial = tablerow ; 
selectedoncecount_table_dentolStatements++;
dentolStatements[tablerow].selected = 1;} /*end of TRIAL_SELECTED_ONCE */
error_status=0; /* because there is a table, this must be after table TRIAL SELECTION stuff */
psy_clear_screen_db();
psy_mouse_visibility( 1 );
psy_add_centered_bitmap_db( selector,-100,40,0);
psy_draw_all_db();
psy_add_centered_bitmap_db( selector,100,40,0);
psy_draw_all_db();
psy_add_text_rgb_db( arial, 0,-80, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, dentolStatements[tablerow].c1 , 0 );
psy_draw_all_db();
psy_add_text_rgb_db( arial, -100,40, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, "False" , 0 );
psy_draw_all_db();
psy_add_text_rgb_db( arial, 100,40, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, "True" , 0 );
psy_draw_all_db();
psy_mouse_click_bitmap_rectangle( 'l',1,10000);
break;
case 2:
task_dentolStatements.step++;
task_dentolStatements.mouseX = keystatus.mouse_x ; 
task_dentolStatements.mouseY = keystatus.mouse_y ; 
dislikeLike=psy_bitmap_under_mouse(0,-1,-1,task_dentolStatements.mouseX,task_dentolStatements.mouseY);
reactTime = keystatus.time ; 
addoutput(elabScenario+' '+"dentolStatements"+' '+(tablerow+1)+' '+general_trial_counter+' '+keystatus.time+' '+dislikeLike);
setTimeout(current_block+".run()",0)
break;
}}}


/* TASK: dentolAdjectives -------------------*/
var task_dentolAdjectives = { step:1, task_trial_selection:0, current_trial: -1, taskname: "task_dentolAdjectives",tasknumber:9,
start: function(trial_selection){task_dentolAdjectives.trial_selection=trial_selection; task_dentolAdjectives.step=1;
psy_clear_stimulus_counters_db();task_dentolAdjectives.run();},
mouseX: 0,
mouseY: 0,
run: function(){
current_task = task_dentolAdjectives.taskname ; 
switch( task_dentolAdjectives.step ){
case 1:
task_dentolAdjectives.step++;
general_trial_counter++ ;
task_dentolAdjectives.mouseX = task_dentolAdjectives.mouseY = 0 ; /* init local variables */
if ( task_dentolAdjectives.trial_selection == TRIAL_SELECTION_RANDOM ){
tablerow = psy_random( 0 , 2 )
task_dentolAdjectives.current_trial = tablerow ; }
if ( task_dentolAdjectives.trial_selection == TRIAL_SELECTION_RANDOM_NEVER_REPEAT ){
 tablerow = psy_random( 0 , 2 ); 
 while( tablerow == task_dentolAdjectives.current_trial )
   tablerow = psy_random( 0 , 2 );
 task_dentolAdjectives.current_trial = tablerow ; } 
if ( task_dentolAdjectives.trial_selection == TRIAL_SELECTION_FIXED_SEQUENCE ){
task_dentolAdjectives.current_trial++;
 if ( task_dentolAdjectives.current_trial == 3 ) task_dentolAdjectives.current_trial = 0 ;
 tablerow = task_dentolAdjectives.current_trial;}
if ( task_dentolAdjectives.trial_selection == TRIAL_SELECTION_REPEAT_ON_ERROR ){
if (error_status!=0 && task_dentolAdjectives.current_trial != -1 ){tablerow = task_dentolAdjectives.current_trial }else{
tablerow = psy_random( 0 , 2 )
task_dentolAdjectives.current_trial = tablerow ; }}
if ( task_dentolAdjectives.trial_selection == TRIAL_SELECTION_ONCE ){
/* if all trials have been selected, set all selected fields of table to zero */
if(selectedoncecount_table_dentolAdjectives == 3 ){
for(tmptr=0;tmptr<3;tmptr++)
dentolAdjectives[tmptr].selected = 0;
selectedoncecount_table_dentolAdjectives = 0;
} /*end of if selectedoncecount */
 tablerow = psy_random( 0 ,2 ); 
 while( dentolAdjectives[tablerow].selected == 1 || tablerow == task_dentolAdjectives.current_trial )
 tablerow = psy_random( 0 ,2 ); 
task_dentolAdjectives.current_trial = tablerow ; 
selectedoncecount_table_dentolAdjectives++;
dentolAdjectives[tablerow].selected = 1;} /*end of TRIAL_SELECTED_ONCE */
error_status=0; /* because there is a table, this must be after table TRIAL SELECTION stuff */
psy_clear_screen_db();
psy_mouse_visibility( 1 );
psy_add_centered_bitmap_db( selector,-100,40,0);
psy_draw_all_db();
psy_add_centered_bitmap_db( selector,100,40,0);
psy_draw_all_db();
psy_add_text_rgb_db( arial, 0,-80, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, dentolAdjectives[tablerow].c1 , 0 );
psy_draw_all_db();
psy_add_text_rgb_db( arial, -100,40, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, dentolAdjectives[tablerow].c2 , 0 );
psy_draw_all_db();
psy_add_text_rgb_db( arial, 100,40, PSY_CENTRAL, PSY_CENTRAL, 255, 255, 255, dentolAdjectives[tablerow].c3 , 0 );
psy_draw_all_db();
psy_mouse_click_bitmap_rectangle( 'l',1,10000);
break;
case 2:
task_dentolAdjectives.step++;
task_dentolAdjectives.mouseX = keystatus.mouse_x ; 
task_dentolAdjectives.mouseY = keystatus.mouse_y ; 
falseTrue=psy_bitmap_under_mouse(0,-1,-1,task_dentolAdjectives.mouseX,task_dentolAdjectives.mouseY);
falseTrue = keystatus.time ; 
addoutput(elabScenario+' '+"dentolAdjectives"+' '+(tablerow+1)+' '+general_trial_counter+' '+keystatus.time+' '+falseTrue);
setTimeout(current_block+".run()",0)
break;
}}}
/* block name: intro ----------------------- */
var block_intro = {
blockname: "block_intro", step: 1, trial_counter: 0,
trial_counter_per_task: [0], max_trials_in_block: 999999, criteria_fullfilled: 1, choosetask: 0,
start: function(){block_intro.step=1; current_block="block_intro";
block_intro.trial_counter_per_task[0]=1;
psy_clear_stimulus_counters_db();block_intro.run();},

run: function(){
current_block = block_intro.blockname ; 
switch( block_intro.step ){
case 1:
block_intro.step++;
psy_wait(intro,32)
break;
case 2:
block_intro.step++;
psy_clear_screen_db();
block_intro.run();
break;
case 3:
block_intro.step++;
/*-- start the task part of the block -- */
/* First, make sure the screen is cleared */
psy_clear_screen_db();
block_intro.max_trials_in_block=999999;
block_intro.criteria_fullfilled=1;if( block_intro.criteria_fullfilled > 0 && block_intro.trial_counter <= block_intro.max_trials_in_block){
block_intro.trial_counter++;
task_elabInstr.start(TRIAL_SELECTION_RANDOM);
}else{setTimeout("block_intro.run()",0)}
break;
case 4:
block_intro.step++;
block_intro.trial_counter_per_task[0]--;
if ( block_intro.trial_counter_per_task[0] == 0 || block_intro.trial_counter >= block_intro.max_trials_in_block || tasklist_end_request == 1 || experiment_end_request == 1 ) { block_intro.criteria_fullfilled = 0 ; tasklist_end_request = 0 ; }
if ( block_intro.criteria_fullfilled == 1 ){ block_intro.step=block_intro.step-2 ; setTimeout("block_intro.run()",0)
}else{setTimeout("block_intro.run()",0)}
break;
case 5:
block_intro.step++;
psy_clear_screen_db();
setTimeout("blocks"+psy_blockorder+".run()",0)
break;
}}}
/* block name: dentolMessag ----------------------- */
var block_dentolMessag = {
blockname: "block_dentolMessag", step: 1, trial_counter: 0,
trial_counter_per_task: [0], max_trials_in_block: 999999, criteria_fullfilled: 1, choosetask: 0,
start: function(){block_dentolMessag.step=1; current_block="block_dentolMessag";
block_dentolMessag.trial_counter_per_task[0]=1;
psy_clear_stimulus_counters_db();block_dentolMessag.run();},

run: function(){
current_block = block_dentolMessag.blockname ; 
switch( block_dentolMessag.step ){
case 1:
block_dentolMessag.step++;
/*-- start the task part of the block -- */
/* First, make sure the screen is cleared */
psy_clear_screen_db();
block_dentolMessag.max_trials_in_block=999999;
block_dentolMessag.criteria_fullfilled=1;if( block_dentolMessag.criteria_fullfilled > 0 && block_dentolMessag.trial_counter <= block_dentolMessag.max_trials_in_block){
block_dentolMessag.trial_counter++;
task_dentolMessage.start(TRIAL_SELECTION_RANDOM);
}else{setTimeout("block_dentolMessag.run()",0)}
break;
case 2:
block_dentolMessag.step++;
block_dentolMessag.trial_counter_per_task[0]--;
if ( block_dentolMessag.trial_counter_per_task[0] == 0 || block_dentolMessag.trial_counter >= block_dentolMessag.max_trials_in_block || tasklist_end_request == 1 || experiment_end_request == 1 ) { block_dentolMessag.criteria_fullfilled = 0 ; tasklist_end_request = 0 ; }
if ( block_dentolMessag.criteria_fullfilled == 1 ){ block_dentolMessag.step=block_dentolMessag.step-2 ; setTimeout("block_dentolMessag.run()",0)
}else{setTimeout("block_dentolMessag.run()",0)}
break;
case 3:
block_dentolMessag.step++;
psy_clear_screen_db();
setTimeout("blocks"+psy_blockorder+".run()",0)
break;
}}}
/* block name: coverInstr ----------------------- */
var block_coverInstr = {
blockname: "block_coverInstr", step: 1, trial_counter: 0,
trial_counter_per_task: [0], max_trials_in_block: 999999, criteria_fullfilled: 1, choosetask: 0,
start: function(){block_coverInstr.step=1; current_block="block_coverInstr";
block_coverInstr.trial_counter_per_task[0]=1;
psy_clear_stimulus_counters_db();block_coverInstr.run();},

run: function(){
current_block = block_coverInstr.blockname ; 
switch( block_coverInstr.step ){
case 1:
block_coverInstr.step++;
/*-- start the task part of the block -- */
/* First, make sure the screen is cleared */
psy_clear_screen_db();
block_coverInstr.max_trials_in_block=999999;
block_coverInstr.criteria_fullfilled=1;if( block_coverInstr.criteria_fullfilled > 0 && block_coverInstr.trial_counter <= block_coverInstr.max_trials_in_block){
block_coverInstr.trial_counter++;
task_coverInstr.start(TRIAL_SELECTION_RANDOM);
}else{setTimeout("block_coverInstr.run()",0)}
break;
case 2:
block_coverInstr.step++;
block_coverInstr.trial_counter_per_task[0]--;
if ( block_coverInstr.trial_counter_per_task[0] == 0 || block_coverInstr.trial_counter >= block_coverInstr.max_trials_in_block || tasklist_end_request == 1 || experiment_end_request == 1 ) { block_coverInstr.criteria_fullfilled = 0 ; tasklist_end_request = 0 ; }
if ( block_coverInstr.criteria_fullfilled == 1 ){ block_coverInstr.step=block_coverInstr.step-2 ; setTimeout("block_coverInstr.run()",0)
}else{setTimeout("block_coverInstr.run()",0)}
break;
case 3:
block_coverInstr.step++;
psy_clear_screen_db();
setTimeout("blocks"+psy_blockorder+".run()",0)
break;
}}}
/* block name: coverStatementsAdjectives ----------------------- */
var block_coverStatementsAdjectives = {
blockname: "block_coverStatementsAdjectives", step: 1, trial_counter: 0,
trial_counter_per_task: [0], max_trials_in_block: 999999, criteria_fullfilled: 1, choosetask: 0,
start: function(){block_coverStatementsAdjectives.step=1; current_block="block_coverStatementsAdjectives";
block_coverStatementsAdjectives.trial_counter_per_task[0]=3;
block_coverStatementsAdjectives.trial_counter_per_task[1]=3;
psy_clear_stimulus_counters_db();block_coverStatementsAdjectives.run();},

run: function(){
current_block = block_coverStatementsAdjectives.blockname ; 
switch( block_coverStatementsAdjectives.step ){
case 1:
block_coverStatementsAdjectives.step++;
/*-- start the task part of the block -- */
/* First, make sure the screen is cleared */
psy_clear_screen_db();
block_coverStatementsAdjectives.max_trials_in_block=999999;
block_coverStatementsAdjectives.criteria_fullfilled=1;if( block_coverStatementsAdjectives.criteria_fullfilled > 0 && block_coverStatementsAdjectives.trial_counter <= block_coverStatementsAdjectives.max_trials_in_block){
trials_left_to_do=0;
for( i=0;i<2;i++)trials_left_to_do+=block_coverStatementsAdjectives.trial_counter_per_task[i];
task_probability[0] = block_coverStatementsAdjectives.trial_counter_per_task[0] / trials_left_to_do;
task_probability[1] = block_coverStatementsAdjectives.trial_counter_per_task[1] / trials_left_to_do;
block_coverStatementsAdjectives.choosetask = psy_random_weighted( task_probability , 2);
block_coverStatementsAdjectives.trial_counter++;
switch(block_coverStatementsAdjectives.choosetask){
case 0 :
task_coverStatements.start(TRIAL_SELECTION_RANDOM_NEVER_REPEAT);break;
case 1 :
task_coverAdjectives.start(TRIAL_SELECTION_RANDOM_NEVER_REPEAT);break;
}/*end case*/
}
else{setTimeout("block_coverStatementsAdjectives.run()",0)}
break;
case 2:
block_coverStatementsAdjectives.step++;
switch(block_coverStatementsAdjectives.choosetask){
case 0 :
block_coverStatementsAdjectives.trial_counter_per_task[ 0 ]--;break;
case 1 :
block_coverStatementsAdjectives.trial_counter_per_task[ 1 ]--;break;
}/*end case*/
block_coverStatementsAdjectives.criteria_fullfilled = 0 ;
for( i=0;i<2;i++)block_coverStatementsAdjectives.criteria_fullfilled+=block_coverStatementsAdjectives.trial_counter_per_task[i];
if ( tasklist_end_request == 1 || block_coverStatementsAdjectives.trial_counter >= block_coverStatementsAdjectives.max_trials_in_block ){block_coverStatementsAdjectives.criteria_fullfilled=0;tasklist_end_request=0;}
if ( block_coverStatementsAdjectives.criteria_fullfilled > 0 ){ block_coverStatementsAdjectives.step=block_coverStatementsAdjectives.step-2 ; setTimeout("block_coverStatementsAdjectives.run()",0)
}else{setTimeout("block_coverStatementsAdjectives.run()",0)}
break;
case 3:
block_coverStatementsAdjectives.step++;
psy_clear_screen_db();
setTimeout("blocks"+psy_blockorder+".run()",0)
break;
}}}
/* block name: dentolInstr ----------------------- */
var block_dentolInstr = {
blockname: "block_dentolInstr", step: 1, trial_counter: 0,
trial_counter_per_task: [0], max_trials_in_block: 999999, criteria_fullfilled: 1, choosetask: 0,
start: function(){block_dentolInstr.step=1; current_block="block_dentolInstr";
block_dentolInstr.trial_counter_per_task[0]=1;
psy_clear_stimulus_counters_db();block_dentolInstr.run();},

run: function(){
current_block = block_dentolInstr.blockname ; 
switch( block_dentolInstr.step ){
case 1:
block_dentolInstr.step++;
/*-- start the task part of the block -- */
/* First, make sure the screen is cleared */
psy_clear_screen_db();
block_dentolInstr.max_trials_in_block=999999;
block_dentolInstr.criteria_fullfilled=1;if( block_dentolInstr.criteria_fullfilled > 0 && block_dentolInstr.trial_counter <= block_dentolInstr.max_trials_in_block){
block_dentolInstr.trial_counter++;
task_dentolInstr.start(TRIAL_SELECTION_RANDOM);
}else{setTimeout("block_dentolInstr.run()",0)}
break;
case 2:
block_dentolInstr.step++;
block_dentolInstr.trial_counter_per_task[0]--;
if ( block_dentolInstr.trial_counter_per_task[0] == 0 || block_dentolInstr.trial_counter >= block_dentolInstr.max_trials_in_block || tasklist_end_request == 1 || experiment_end_request == 1 ) { block_dentolInstr.criteria_fullfilled = 0 ; tasklist_end_request = 0 ; }
if ( block_dentolInstr.criteria_fullfilled == 1 ){ block_dentolInstr.step=block_dentolInstr.step-2 ; setTimeout("block_dentolInstr.run()",0)
}else{setTimeout("block_dentolInstr.run()",0)}
break;
case 3:
block_dentolInstr.step++;
psy_clear_screen_db();
setTimeout("blocks"+psy_blockorder+".run()",0)
break;
}}}
/* block name: dentolStatementsAdjectives ----------------------- */
var block_dentolStatementsAdjectives = {
blockname: "block_dentolStatementsAdjectives", step: 1, trial_counter: 0,
trial_counter_per_task: [0], max_trials_in_block: 999999, criteria_fullfilled: 1, choosetask: 0,
start: function(){block_dentolStatementsAdjectives.step=1; current_block="block_dentolStatementsAdjectives";
block_dentolStatementsAdjectives.trial_counter_per_task[0]=3;
block_dentolStatementsAdjectives.trial_counter_per_task[1]=3;
psy_clear_stimulus_counters_db();block_dentolStatementsAdjectives.run();},

run: function(){
current_block = block_dentolStatementsAdjectives.blockname ; 
switch( block_dentolStatementsAdjectives.step ){
case 1:
block_dentolStatementsAdjectives.step++;
/*-- start the task part of the block -- */
/* First, make sure the screen is cleared */
psy_clear_screen_db();
block_dentolStatementsAdjectives.max_trials_in_block=999999;
block_dentolStatementsAdjectives.criteria_fullfilled=1;if( block_dentolStatementsAdjectives.criteria_fullfilled > 0 && block_dentolStatementsAdjectives.trial_counter <= block_dentolStatementsAdjectives.max_trials_in_block){
trials_left_to_do=0;
for( i=0;i<2;i++)trials_left_to_do+=block_dentolStatementsAdjectives.trial_counter_per_task[i];
task_probability[0] = block_dentolStatementsAdjectives.trial_counter_per_task[0] / trials_left_to_do;
task_probability[1] = block_dentolStatementsAdjectives.trial_counter_per_task[1] / trials_left_to_do;
block_dentolStatementsAdjectives.choosetask = psy_random_weighted( task_probability , 2);
block_dentolStatementsAdjectives.trial_counter++;
switch(block_dentolStatementsAdjectives.choosetask){
case 0 :
task_dentolStatements.start(TRIAL_SELECTION_RANDOM_NEVER_REPEAT);break;
case 1 :
task_dentolAdjectives.start(TRIAL_SELECTION_RANDOM_NEVER_REPEAT);break;
}/*end case*/
}
else{setTimeout("block_dentolStatementsAdjectives.run()",0)}
break;
case 2:
block_dentolStatementsAdjectives.step++;
switch(block_dentolStatementsAdjectives.choosetask){
case 0 :
block_dentolStatementsAdjectives.trial_counter_per_task[ 0 ]--;break;
case 1 :
block_dentolStatementsAdjectives.trial_counter_per_task[ 1 ]--;break;
}/*end case*/
block_dentolStatementsAdjectives.criteria_fullfilled = 0 ;
for( i=0;i<2;i++)block_dentolStatementsAdjectives.criteria_fullfilled+=block_dentolStatementsAdjectives.trial_counter_per_task[i];
if ( tasklist_end_request == 1 || block_dentolStatementsAdjectives.trial_counter >= block_dentolStatementsAdjectives.max_trials_in_block ){block_dentolStatementsAdjectives.criteria_fullfilled=0;tasklist_end_request=0;}
if ( block_dentolStatementsAdjectives.criteria_fullfilled > 0 ){ block_dentolStatementsAdjectives.step=block_dentolStatementsAdjectives.step-2 ; setTimeout("block_dentolStatementsAdjectives.run()",0)
}else{setTimeout("block_dentolStatementsAdjectives.run()",0)}
break;
case 3:
block_dentolStatementsAdjectives.step++;
psy_clear_screen_db();
psy_add_text_rgb_db( 0 , 0 , -100 , PSY_CENTRAL , PSY_CENTRAL , 255,255,255 , "!! For debugging purposes, remove before using with live subjects !!" , 0 );
psy_draw_all_db();
tmptext = "&dislikeLike: " + dislikeLike + " (Dislike=1, Like=2)";
psy_add_text_rgb_db( 0 , 0 , 0 , PSY_CENTRAL,PSY_CENTRAL,255,255,255,tmptext , 0 );
psy_draw_all_db();
tmptext = "&falseTrue:   " + falseTrue + " (False=1, True=2)";
psy_add_text_rgb_db( 0 , 0 , 20 , PSY_CENTRAL,PSY_CENTRAL,255,255,255,tmptext , 0 );
psy_draw_all_db();
tmptext = "&reactTime:   " + reactTime + " (ms)";
psy_add_text_rgb_db( 0 , 0 , 40 , PSY_CENTRAL,PSY_CENTRAL,255,255,255,tmptext , 0 );
psy_draw_all_db();
psy_add_text_rgb_db( 0 , 0 , 80 , PSY_CENTRAL , PSY_CENTRAL , 255,255,255 , "(press space to continue)" , 0 );
psy_draw_all_db();
psy_wait(0,32);
/*-- end of the feedback part of the block -- */
break;
case 4:
block_dentolStatementsAdjectives.step++;
psy_clear_screen_db();
setTimeout("blocks"+psy_blockorder+".run()",0)
break;
}}}
/* block name: thankYouMessage ----------------------- */
var block_thankYouMessage = {
blockname: "block_thankYouMessage", step: 1, trial_counter: 0,
trial_counter_per_task: [0], max_trials_in_block: 999999, criteria_fullfilled: 1, choosetask: 0,
start: function(){block_thankYouMessage.step=1; current_block="block_thankYouMessage";
block_thankYouMessage.trial_counter_per_task[0]=1;
psy_clear_stimulus_counters_db();block_thankYouMessage.run();},

run: function(){
current_block = block_thankYouMessage.blockname ; 
switch( block_thankYouMessage.step ){
case 1:
block_thankYouMessage.step++;
/*-- start the task part of the block -- */
/* First, make sure the screen is cleared */
psy_clear_screen_db();
block_thankYouMessage.max_trials_in_block=999999;
block_thankYouMessage.criteria_fullfilled=1;if( block_thankYouMessage.criteria_fullfilled > 0 && block_thankYouMessage.trial_counter <= block_thankYouMessage.max_trials_in_block){
block_thankYouMessage.trial_counter++;
task_thankYouMessage.start(TRIAL_SELECTION_RANDOM);
}else{setTimeout("block_thankYouMessage.run()",0)}
break;
case 2:
block_thankYouMessage.step++;
block_thankYouMessage.trial_counter_per_task[0]--;
if ( block_thankYouMessage.trial_counter_per_task[0] == 0 || block_thankYouMessage.trial_counter >= block_thankYouMessage.max_trials_in_block || tasklist_end_request == 1 || experiment_end_request == 1 ) { block_thankYouMessage.criteria_fullfilled = 0 ; tasklist_end_request = 0 ; }
if ( block_thankYouMessage.criteria_fullfilled == 1 ){ block_thankYouMessage.step=block_thankYouMessage.step-2 ; setTimeout("block_thankYouMessage.run()",0)
}else{setTimeout("block_thankYouMessage.run()",0)}
break;
case 3:
block_thankYouMessage.step++;
psy_clear_screen_db();
setTimeout("blocks"+psy_blockorder+".run()",0)
break;
}}}

function main(){
c.focus();
psy_screen_height = 600 ;
psy_screen_width = 800 ;
psy_screen_center_x = psy_screen_width / 2 ;
psy_screen_center_y = psy_screen_height / 2 ;
psy_set_coordinate_system('c');
psy_exp_start_time = psy_exp_current_time = new Date().getTime();
psy_mouse_visibility( 0 );
/* centerzero: mean 0,0 is at the center of screen */
psy_load_font("Arial",18);
psy_load_bitmap("intro.png");
psy_load_bitmap("selector.png");

/* -- definition of block(s) -------------------------- */
when_stimuli_loaded_do("blocks"+psy_blockorder+".run()")}

/* -- calls to the blocks -------------------------------- */
var blocks1 = {blocknumber: 0,nblocks: 7 , run: function(){ blocks1.blocknumber++; switch ( blocks1.blocknumber ) {
case 1: block_intro.start(); break;
case 2: block_dentolMessag.start(); break;
case 3: block_coverInstr.start(); break;
case 4: block_coverStatementsAdjectives.start(); break;
case 5: block_dentolInstr.start(); break;
case 6: block_dentolStatementsAdjectives.start(); break;
case 7: block_thankYouMessage.start(); break;
case 8:
break;}}}
