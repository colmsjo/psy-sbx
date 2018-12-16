#include <psy.2.5.2.h>
#include <sched.h>
#include <string.h>

#include <sys/stat.h> /* for file status check */

#include <sys/types.h>
#include <unistd.h>
#include <libusb-1.0/libusb.h>
#define psyscript_variable_from_file(v,f){FILE *temp;temp=fopen(f,"r");fscanf(temp,"%d",&v);fclose(temp);}
/* define bitmaps (if any)*/
#define cross 1
/* define videos (if any)*/

/* define sounds (if any)*/

/* define fonts (if any)*/

/* global variables for tasks, blocks, and feedback */
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
int trial_counter_per_task[0] ;
float task_probability[0] ;
char blockname[200];
int blocknumber = 0 ;
int blockrepeat = 1;
int general_trial_counter = 0 ;
/* block name: testBlock ----------------------- */
void block_testBlock(){
psy_clear_stimulus_counters_db(); /* clear stimulus counter for displaying of bitmaps */
psy_clear_screen_db();
strcpy((char *)blockname,"testBlock");
