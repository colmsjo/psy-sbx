#include <psy.2.5.2.h>
#include <sched.h>
#include <string.h>

#include <sys/stat.h> /* for file status check */

#include <sys/types.h>
#include <unistd.h>
#include <libusb-1.0/libusb.h>
#define psyscript_variable_from_file(v,f){FILE *temp;temp=fopen(f,"r");fscanf(temp,"%d",&v);fclose(temp);}
/* define bitmaps (if any)*/
#define left 1
#define right 2
#define fix 3
/* define videos (if any)*/

/* define sounds (if any)*/

/* define fonts (if any)*/
#define arial 0

/* global variables for tasks, blocks, and feedback */
int MyPerc = 0 ;
int MyMean = 0 ;
int MyCount = 0 ;
/* global timestamp variables in tasks */
/* global variables */
FILE *datafile ; /* for saving experimental output */
FILE *logfile  ; /* for saving some information about run time of experiment */
struct stat filestatus ; /* for check existence of /dev/shm/data */
int trial_counter , i; 
int max_trials_in_block=100000 ; /* used for checking if somebody cannot reach criterion */
int trials_left_to_do,criteria_fullfilled;
int psy_vsync_delay = 0 ; /* used for time waiting for vsync */
psy_key_status keystatus; /* used for save (temporary) data from keyboard and mouse */
int psy_blockorder = 1; /* higher than 1 if there is random blockorder */
int tasklist_end_request = 0; /* used to end. Value higher than 0 ends tasklist. */
int experiment_end_request = 0; /* used to end experiment. Value higher than 0 prevents other blocks from running. */
psy_timer Timer_tasklist_begin, Timer_tasklist_now; /* used for tracking time of a tasklist */
int maxtasklisttime = 0 ; /* used for tracking time of a tasklist */
#define TRIAL_SELECTION_RANDOM              0
#define TRIAL_SELECTION_RANDOM_NEVER_REPEAT 1
#define TRIAL_SELECTION_FIXED_SEQUENCE      2
#define TRIAL_SELECTION_REPEAT_ON_ERROR     3
#define TRIAL_SELECTION_ONCE                4
int error_status; /* optionally used in blocks and tasks for encoding the task status */
int trial_counter_per_task[2] ;
float task_probability[2] ;
char blockname[200];
int blocknumber = 0 ;
int blockrepeat = 1;
int general_trial_counter = 0 ;
int selectedoncecount_table_simontasktable = 0 ;
struct simontasktabletype { const char *c1; int c2; int c3; int c4; int c5; int selected;};
struct simontasktabletype simontasktable[]={
{  "L_pos L_arrow", -200, 1, left, 1,0}, 
{  "R_pos R_arrow", 200, 2, right, 2,0}, 
{  "R_pos L_arrow", 200, 3, left, 1,0}, 
{  "L_pos R_arrow", -200, 4, right, 2,0}, 
};


/* TASK: intro -------------------*/
void task_intro(char trial_selection){
const char * TASKNAME = "intro";
/* -- local variables needed for TRIAL_SELECTION_ONCE */
int tmptr; /* used in a loop for seting field 'selected' of table to 0 */
/* -- local variables defined by 'set' in the task script */
general_trial_counter++ ;
psy_clear_stimulus_counters_db(); /* clear stimulus counter for displaying of bitmaps */
error_status = 0 ; /* necessary only if error option is used */
}


/* TASK: simon -------------------*/
void task_simon(char trial_selection){
const char * TASKNAME = "simon";
/* -- local variables needed for TRIAL_SELECTION_ONCE */
int tmptr; /* used in a loop for seting field 'selected' of table to 0 */
/* -- local variables defined by 'set' in the task script */
general_trial_counter++ ;
psy_clear_stimulus_counters_db(); /* clear stimulus counter for displaying of bitmaps */
psy_clear_screen_db();
static int current_trial = -1;
int tablerow;
if ( trial_selection == TRIAL_SELECTION_RANDOM ){
 tablerow = psy_random( 0 , 3 ); 
 current_trial = tablerow ; } 
if ( trial_selection == TRIAL_SELECTION_RANDOM_NEVER_REPEAT ){
 tablerow = psy_random( 0 ,3 ); 
 while( tablerow == current_trial )
   tablerow = psy_random( 0 ,3 );
 current_trial = tablerow ; } 
if ( trial_selection == TRIAL_SELECTION_FIXED_SEQUENCE ){
 current_trial ++ ;
 if ( current_trial == 4 ) current_trial = 0 ;
 tablerow = current_trial ;}
if ( trial_selection == TRIAL_SELECTION_REPEAT_ON_ERROR ){
if( error_status!=0 && current_trial != -1 ){tablerow = current_trial;}else{
 tablerow = psy_random( 0 , 3 ); 
 current_trial = tablerow ; }}
if ( trial_selection == TRIAL_SELECTION_ONCE ){
/* if all trials have been selected, set all selected fields of table to zero */
if(selectedoncecount_table_simontasktable == 4 ){
for(tmptr=0;tmptr<4;tmptr++)
simontasktable[tmptr].selected = 0;
selectedoncecount_table_simontasktable = 0;
} /*end of if selectedoncecount */
 tablerow = psy_random( 0 ,3 ); 
 while( simontasktable[tablerow].selected == 1 || tablerow == current_trial )
   tablerow = psy_random( 0 , 3 );
 current_trial = tablerow ; 
selectedoncecount_table_simontasktable++;
simontasktable[tablerow].selected = 1;} /*end of TRIAL_SELECTED_ONCE */
error_status=0; /* because there is a table, this must be after table TRIAL SELECTION stuff */
int possiblekeys[]={SDL_SCANCODE_A,SDL_SCANCODE_L};
psy_add_centered_bitmap_db(fix,PSY_CENTRAL,PSY_CENTRAL,0);
psy_draw_all_db();
//psy_vsync_delay = psy_wait_vsync();
SDL_RenderPresent( screen );
psy_delay( 100 );
psy_add_centered_bitmap_db(simontasktable[tablerow].c4,simontasktable[tablerow].c2,0,0);
psy_draw_all_db();
//psy_vsync_delay = psy_wait_vsync();
SDL_RenderPresent( screen );
keystatus=psy_keyboard(possiblekeys,2,simontasktable[tablerow].c5- 1 ,2000);
psy_delay( 3000 );
fprintf( datafile,"%s %s %d %d %d %d %d \n",blockname,simontasktable[tablerow].c1,simontasktable[tablerow].c3,(tablerow+1),keystatus.key + 1,keystatus.status,keystatus.time
);
}
/* block name: mytrainingblock ----------------------- */
void block_mytrainingblock(){
psy_clear_stimulus_counters_db(); /* clear stimulus counter for displaying of bitmaps */
psy_clear_screen_db();
strcpy((char *)blockname,"mytrainingblock");
