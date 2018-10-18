import * as ActionTypes from '../action-types/index'
import { ParseDueDate } from '../../pounder-utilities';
import { ProjectLayoutStore } from '../../pounder-stores';
import { AccountConfigFallback } from '../../pounder-firebase';

export function appReducer(state, action) {
    switch (action.type) {
        case ActionTypes.CHANGE_FOCUSED_TASKLIST:
            return { 
                ...state,
                focusedTaskListId: action.id,
                isTaskListJumpMenuOpen: false,
                selectedTask: processSelectedTask(state.selectedTask, action.id),
                openTaskOptionsId: -1,
            };
        
        case ActionTypes.SELECT_TASK:
            const openCalendarId = state.openCalendarId === action.taskId ? action.taskId : -1; // Keep calender open if Open already.

            return {
                ...state,
                selectedTask: {
                    taskListWidgetId: action.taskListWidgetId,
                    taskId: action.taskId,
                    isInputOpen: false,
                },
                focusedTaskListId: action.taskListWidgetId,
                isATaskMoving: false,
                movingTaskId: -1,
                sourceTaskListId: -1,
                openCalendarId: openCalendarId,
                openTaskListSettingsMenuId: -1,
                isTaskListJumpMenuOpen: false,
            };
        
        case ActionTypes.OPEN_TASK:
            return {
                ...state,
                selectedTask: {
                    taskListWidgetId: action.taskListWidgetId,
                    taskId: action.taskId,
                    isInputOpen: true,
                },
                openTaskOptionsId: -1,
                isATaskMoving: false,
                movingTaskId: -1,
                sourceTaskListId: -1,
                openCalendarId: -1,
                openTaskListSettingsMenuId: -1
            }

        case ActionTypes.SET_OPEN_TASK_LIST_WIDGET_HEADER_ID:
            return {
                ...state,
                openTaskListWidgetHeaderId: action.value,
            }
        
        case ActionTypes.CLOSE_TASK:
            return {
                ...state,
                selectedTask: {
                    taskListWidgetId: action.taskListWidgetId,
                    taskId: action.taskId,
                    isInputOpen: false,
                }
            }

        case ActionTypes.SET_IS_SIDEBAR_OPEN:
            return {
                ...state,
                isSidebarOpen: action.value,
            }

        case ActionTypes.START_TASK_MOVE:
            return {
                ...state,
                isATaskMoving: true,
                selectedTask: {
                    taskListWidgetId: action.sourceTaskListWidgetId,
                    taskId: action.taskId,
                    isInputOpen: false,
                },
                focusedTaskListId: action.sourceTaskListWidgetId,
                movingTaskId: action.movingTaskId,
                sourceTaskListId: action.sourceTaskListWidgetId,
                openCalendarId: -1,
                openTaskListSettingsMenuId: -1,
            }

        case ActionTypes.START_TASK_MOVE_IN_DATABASE:
            return {
                ...state,
                isAwaitingFirebase: true
            }
        
        case ActionTypes.END_TASK_MOVE:
            return {
                ...state,
                isAwaitingFirebase: false,
                isATaskMoving: false,
                sourceTaskListId: -1,
                movingTaskId: -1,
                selectedTask: {
                    taskListWidgetId: action.destinationTaskListWidgetId,
                    taskId: action.movedTaskId,
                    isInputOpen: false,
                }
            }
        
        case ActionTypes.OPEN_TASK_INFO: 
            return {
                ...state,
                openTaskInfoId: action.value,
            }
        
        case ActionTypes.CLOSE_TASK_INFO:
            return {
                ...state,
                openTaskInfoId: -1,
                taskComments: [],
            }

        case ActionTypes.CANCEL_TASK_MOVE: 
            return {
                ...state,
                isATaskMoving: false,
                sourceTaskListId: -1,
                movingTaskId: -1,
            }

        case ActionTypes.START_PROJECTS_FETCH:
            return {
                ...state,
                isAwaitingFirebase: true
            }

        case ActionTypes.SET_FLOATING_TEXT_INPUT:
            return {
                ...state,
                floatingTextInput: action.value,
            }
        
        case ActionTypes.RECEIVE_LOCAL_PROJECTS:
            return {
                ...state,
                localProjects: action.projects,
                projects: [...sortProjects(state.generalConfig.sortProjectsBy, action.projects), ...state.remoteProjects],
                isAwaitingFirebase: false,
            }

        case ActionTypes.SET_IS_IN_REGISTER_MODE:
            return {
                ...state,
                isInRegisterMode: action.value,
            }

        case ActionTypes.RECEIVE_REMOTE_PROJECTS:
            return {
                ...state,
                remoteProjects: action.projects,
                projects: [...state.localProjects, ...sortProjects(state.generalConfig.sortProjectsBy, action.projects)],
            }
            
        case ActionTypes.SET_UPDATING_USER_IDS: {
            return {
                ...state,
                updatingUserIds: action.value,
            }
        }

        case ActionTypes.RECEIVE_MEMBERS: 
            return {
                ...state,
                members: action.members,
                memberLookup: buildProjectMembersLookup(action.members),
            }

        case ActionTypes.RECEIVE_INVITES: 
            return {
                ...state,
                invites: action.invites,
            }

        case ActionTypes.START_TASKS_FETCH:
            return {
                ...state,
                isAwaitingFirebase: true
            }

        case ActionTypes.RECEIVE_INCOMPLETED_LOCAL_TASKS: 
            var newTasks = [...action.value, ...state.completedLocalTasks, ...state.incompletedRemoteTasks, ...state.completedRemoteTasks]
            return {
                ...state,
                isAwaitingFirebase: false,
                tasks: newTasks,
                incompletedLocalTasks: action.value,
                projectSelectorDueDateDisplays: getProjectSelectorDueDateDisplaysHelper(newTasks),
            }

        case ActionTypes.RECEIVE_COMPLETED_LOCAL_TASKS:
        var newTasks = [...state.incompletedLocalTasks, ...action.value, ...state.incompletedRemoteTasks, ...state.completedRemoteTasks];
            return {
                ...state,
                isAwaitingFirebase: false,
                tasks: newTasks,
                completedLocalTasks: action.value,
            }

        case ActionTypes.RECEIVE_INCOMPLETED_REMOTE_TASKS:
        var newTasks = [...state.incompletedLocalTasks, ...state.completedLocalTasks, ...action.value, ...state.completedRemoteTasks];
            return {
                ...state,
                isAwaitingFirebase: false,
                tasks: newTasks,
                incompletedRemoteTasks: action.value,
                projectSelectorDueDateDisplays: getProjectSelectorDueDateDisplaysHelper(newTasks)
            }
        
        case ActionTypes.RECEIVE_COMPLETED_REMOTE_TASKS:
        var newTasks = [...state.incompletedLocalTasks, ...state.completedLocalTasks, ...state.incompletedRemoteTasks, ...action.value]
            return {
                ...state,
                isAwaitingFirebase: false,
                tasks: newTasks,
                completedRemoteTasks: action.value,
            }

        case ActionTypes.SET_IS_PROJECT_MENU_OPEN:
            return {
                ...state,
                isProjectMenuOpen: action.value,
            }
        
        case ActionTypes.LOCK_APP:
            return {
                ...state,
                isLockScreenDisplayed: true,
            }
        
        case ActionTypes.SET_LAST_BACKUP_DATE:
            return {
                ...state,
                lastBackupDate: action.value,
            }

        case ActionTypes.SET_OPEN_TASKLIST_SETTINGS_MENU_ID: 
            return {
                ...state,
                openTaskListSettingsMenuId: action.id,
                isTaskListJumpMenuOpen: false,
            }
        
        case ActionTypes.OPEN_CALENDAR: 
            return {
                ...state,
                selectedTask: {
                    taskListWidgetId: action.taskListWidgetId,
                    taskId: action.taskId,
                    isInputOpen: false,
                },
                openTaskOptionsId: -1,
                openCalendarId: action.taskId
            }

        case ActionTypes.UNLOCK_APP: 
            return {
                ...state,
                isLockScreenDisplayed: false,
            }

        case ActionTypes.START_TASKLIST_ADD: 
            return {
                ...state,
                isAwaitingFirebase: true
            }
        

        case ActionTypes.START_TASK_ADD:
            return {
                ...state,
                isAwaitingFirebase: true
            }
        
        case ActionTypes.START_TASKLISTS_FETCH:
            return {
                ...state,
                isAwaitingFirebase: true
            }

        case ActionTypes.RECEIVE_LOCAL_TASKLISTS:
            return {
                ...state,
                isAwaitingFirebase: false,
                taskLists: [...action.taskLists, ...state.remoteTaskLists],
                localTaskLists: action.taskLists,
            }

        case ActionTypes.RECEIVE_REMOTE_TASKLISTS:
            return {
                ...state,
                isAwatingFirebase: false,
                taskLists: [...state.localTaskLists, ...action.taskLists],
                remoteTaskLists: action.taskLists,
            }
        
        case ActionTypes.START_PROJECTLAYOUTS_FETCH:
            return {
                ...state,
                isAwaitingFirebase: true,
            }

        case ActionTypes.RECEIVE_LOCAL_PROJECTLAYOUTS:
            return {
                ...state,
                isAwaitingFirebase: false,
                localProjectLayouts: action.value,
                projectLayouts: [...action.value, ...state.remoteProjectLayouts]
            }

        case ActionTypes.RECEIVE_REMOTE_PROJECTLAYOUTS:
            return {
                ...state,
                isAwaitingFirebase: false,
                remoteProjectLayouts: action.value,
                projectLayouts: [...state.localProjectLayouts, ...action.value]
            }

        case ActionTypes.RECEIVE_REMOTE_PROJECT_LAYOUT:
            return {
                ...state,
                isAwaitingFirebase: false,
                remoteProjectLayout: action.projectLayout
            }

        case ActionTypes.SET_OPEN_PROJECT_SELECTOR_ID:
            return {
                ...state,
                openProjectSelectorId: action.value,
            }
        
        case ActionTypes.SELECT_PROJECT:
            return {
                ...state,
                selectedProjectId: action.projectId,
                isSelectedProjectRemote: action.projectId === -1 ? false : isProjectRemote(state, action.projectId),
                openCalendarId: -1,
                selectedTask: {
                    taskListWidgetId: -1,
                    taskId: -1,
                    isInputOpen: false,
                },
                openTaskOptionsId: -1,
                openTaskListWidgetHeaderId: -1,
                openProjectSelectorId: action.projectId === state.openProjectSelectorId ? state.openProjectSelectorId : -1,
                isATaskMoving: false,
                movingTaskId: -1,
                sourceTaskListId: -1,
                focusedTaskListId: -1,
                openTaskListSettingsMenuId: -1,
                isTaskListJumpMenuOpen: false,
                showOnlySelfTasks: false,
            }
        
        case ActionTypes.CLOSE_CALENDAR:
            return {
                ...state,
                openCalendarId: -1
            }
        
        case ActionTypes.SET_PROJECTS_HAVE_PENDING_WRITES: 
            return {
                ...state,
                projectsHavePendingWrites: action.value
            }
        
        case ActionTypes.SET_PROJECTLAYOUTS_HAVE_PENDING_WRITES:
            return {
                ...state,
                projectLayoutsHavePendingWrites: action.value
            }
        
        case ActionTypes.SET_TASKLISTS_HAVE_PENDING_WRITES:
            return {
                ...state,
                taskListsHavePendingWrites: action.value
            }

        case ActionTypes.SET_TASKS_HAVE_PENDING_WRITES:
            return {
                ...state,
                tasksHavePendingWrites: action.value,
            }
        
        case ActionTypes.OPEN_TASK_LIST_JUMP_MENU:
            return {
                ...state,
                isTaskListJumpMenuOpen: true,
            }
        
        case ActionTypes.CLOSE_TASK_LIST_JUMP_MENU:
            return {
                ...state,
                isTaskListJumpMenuOpen: false,
            }
        
        case ActionTypes.SET_IS_SHUTTING_DOWN_FLAG:
            return {
                ...state,
                isShuttingDown: action.value,
            }
        
        case ActionTypes.SET_APP_SETTINGS_MENU_PAGE:
            return {
                ...state,
                appSettingsMenuPage: action.value,
            }

        case ActionTypes.SET_DATABASE_INFO:
            return {
                ...state,
                databaseInfo: action.value
            }

        case ActionTypes.SET_DATABASE_PURGING_FLAG:
            return {
                ...state,
                isDatabasePurging: action.value
            }

        case ActionTypes.SET_IS_DATABASE_RESTORING_FLAG:
            return {
                ...state,
                isDatabaseRestoring: action.value
            }
        
        case ActionTypes.RECEIVE_GENERAL_CONFIG: {
            if (isFirstTimeBoot(action.value)) {
                // First Time Boot.
                return {
                    ...state,
                    generalConfig: action.value,
                    isDexieConfigLoadComplete: true,
                    isAppSettingsOpen: true,
                    isSidebarOpen: true,
                    appSettingsMenuPage: 'account',
                    isInRegisterMode: true,
                }
            }

            else {
                // Normal Config Update.
                return {
                    ...state,
                    generalConfig: action.value,
                    isDexieConfigLoadComplete: true,
                    projects: maybeReSortProjects(state, action.value) // Returns re sorted projects if generalConfig.sortProjectsBy has changed. 
                }
            }
        }

        case ActionTypes.SET_IS_STARTING_UP_FLAG: {
            return {
                ...state,
                isStartingUp: action.value
            }
        }

        case ActionTypes.SET_IS_DEXIE_CONFIG_LOAD_COMPLETE_FLAG: {
            return {
                ...state,
                isDexieConfigLoadComplete: action.value
            }
        }

        case ActionTypes.SET_IS_APP_SETTINGS_OPEN: {
            return {
                ...state,
                isAppSettingsOpen: action.value,
                ignoreFullscreenTrigger: true, // Stops the App toggling to Fullscreen imediately as the User selects the option.
            }
        }

        case ActionTypes.RECEIVE_ACCOUNT_CONFIG: {
            return {
                ...state,
                accountConfig: action.value,
            }
        }

        case ActionTypes.SET_IGNORE_FULLSCREEN_TRIGGER_FLAG: {
            return {
                ...state,
                ignoreFullscreenTrigger: action.value,
            }
        }

        case ActionTypes.RECEIVE_CSS_CONFIG: {
            return {
                ...state,
                cssConfig: action.value,
            }
        }
        
        case ActionTypes.SET_MESSAGE_BOX: {
            return {
                ...state,
                messageBox: action.value,
            }
        }

        case ActionTypes.SET_AUTH_STATUS_MESSAGE: {
            return {
                ...state,
                authStatusMessage: action.value,
            }
        }

        case ActionTypes.SET_IS_LOGGING_IN_FLAG: {
            return {
                ...state,
                isLoggingIn: action.value,
            }
        }

        case ActionTypes.SET_IS_LOGGED_IN_FLAG: {
            return {
                ...state,
                isLoggedIn: action.value,
                isLoggingIn: false,
                isInRegisterMode: false,
            }
        }
        
        case ActionTypes.SET_USER_EMAIL: {
            return {
                ...state,
                userEmail: action.value,
            }
        }

        case ActionTypes.SET_OPEN_TASK_OPTIONS_ID: {
            return {
                ...state,
                openTaskOptionsId: action.value,
            }
        }

        case ActionTypes.POST_SNACKBAR_MESSAGE: {
            return {
                ...state,
                isSnackbarOpen: true,
                snackbarMessage: action.message,
                isSnackbarSelfDismissing: action.isSelfDismissing,
                snackbarType: action.snackbarType
            }
        }

        case ActionTypes.DISMISS_SNACKBAR: {
            return {
                ...state,
                isSnackbarOpen: false,
                snackbarMessage: "",
                isSnackbarSelfDismissing: true,
            }
        }

        case ActionTypes.SET_OPEN_METADATA_ID: {
            return {
                ...state,
                openMetadataId: action.value,
            }
        }

        case ActionTypes.CLEAR_DATA: {
            return {
                ...state,
                projects: [],
                members: [],
                invites: [],
                localProjects: [],
                remoteProjects: [],
                remoteProjectIds: [],
                taskLists: [],
                localTaskLists: [],
                remoteTaskLists: [],
                tasks: [],
                incompletedLocalTasks: [],
                completedLocalTasks: [],
                incompletedRemoteTasks: [],
                completedRemoteTasks: [],
                projectLayouts: [],
                localProjectLayouts: [],
                remoteProjectLayouts: [],
                accountConfig: AccountConfigFallback
            }
        }

        case ActionTypes.SET_UPDATING_INVITE_IDS:
        return {
            ...state,
            updatingInviteIds: action.value,
        }

        case ActionTypes.SET_IS_SHARE_MENU_OPEN: {
            return {
                ...state,
                isShareMenuOpen: action.value,
                userInviteMessage: action.value === false ? '' : state.userInviteMessage,
            }
        }

        case ActionTypes.SET_IS_SHARE_MENU_WAITING: {
            return {
                ...state,
                isShareMenuWaiting: action.value,
            }
        }

        case ActionTypes.SET_SHARE_MENU_MESSAGE: {
            return {
                ...state,
                shareMenuMessage: action.value,
            }
        }

        case ActionTypes.SET_SHARE_MENU_SUB_MESSAGE: {
            return {
                ...state,
                shareMenuSubMessage: action.value,
            }
        }

        case ActionTypes.SET_DISPLAY_NAME: {
            return {
                ...state,
                displayName: action.value,
            }
        }

        case ActionTypes.RECEIVE_REMOTE_PROJECT_IDS: {
            return {
                ...state,
                remoteProjectIds: action.value,
            }
        }

        case ActionTypes.SET_SHOW_ONLY_SELF_TASKS: {
            return {
                ...state,
                showOnlySelfTasks: action.value,
                openTaskOptionsId: -1,
                selectedTask: {taskListWidgetId: -1, taskId: -1, isInputOpen: false},

            }
        }

        case ActionTypes.SET_SHOW_COMPLETED_TASKS: {
            return {
                ...state,
                showCompletedTasks: action.value,
            }
        }

        case ActionTypes.CALCULATE_PROJECT_SELECTOR_DUE_DATE_DISPLAYS: {
            return {
                ...state,
                projectSelectorDueDateDisplays: getProjectSelectorDueDateDisplaysHelper(state.tasks),
            }
        }
        
        case ActionTypes.SET_IS_UPDATE_SNACKBAR_OPEN: {
            return {
                ...state,
                isUpdateSnackbarOpen: action.value,
            }
        }

        case ActionTypes.START_TASK_COMMENTS_GET:
            return {
                ...state,
                taskComments: [],
                isGettingTaskComments: true,
            }

        case ActionTypes.RECEIVE_TASK_COMMENTS:
            return {
                ...state,
                isGettingTaskComments: false,
                taskComments: action.value,
            }

        case ActionTypes.SET_PENDING_TASK_COMMENT_IDS:
            return {
                ...state,
                pendingTaskCommentIds: action.value,
            }

        case ActionTypes.SET_IS_TASK_COMMENTS_PAGINATING:
            return {
                ...state,
                isTaskCommentsPaginating: action.value,
            }

        case ActionTypes.SET_IS_ALL_TASK_COMMENTS_FETCHED:
            return {
                ...state,
                isAllTaskCommentsFetched: action.value,
            }
        
        case ActionTypes.SET_OPEN_TASK_INSPECTOR_ID:
            return {
                ...state,
                openTaskInspectorId: action.value,
            }

        default:
            console.log("App Reducer is missing a Case for action:  " + action.type);
            return state;
    }
}

// Helper Methods.
function maybeReSortProjects(state, newGeneralConfig) {
    if (state.generalConfig.sortProjectsBy !== newGeneralConfig.sortProjectsBy) {
        // Projects need a resort.
        return [...sortProjects(newGeneralConfig.sortProjectsBy, state.localProjects),
             ...sortProjects(newGeneralConfig.sortProjectsBy, state.remoteProjects)] 
    }

    else {
        // No resort required. Just return as is.
        return state.projects;
    }
}


function sortProjects(sortBy, newProjects) {
    var coercedSortBy = sortBy === undefined ? 'alphabetically' : sortBy;
    var sorterFunction = getProjectSorter(coercedSortBy);
    
    return newProjects.sort(sorterFunction);
}

function getProjectSorter(sortBy) {
    switch(sortBy) {
        case 'alphabetically':
        return projectAlphabeticalSorter;

        case 'created':
        return projectCreatedSorter;

        case 'updated':
        return projectUpdatedSorter;

        default:
        return projectAlphabeticalSorter;
    }
}

function buildProjectMembersLookup(members) {
    var lookup = {};
    members.forEach(member => {
        lookup[member.userId] = member.displayName;
    })

    return lookup;
}


function projectAlphabeticalSorter(a,b) {
    var textA = a.projectName.toUpperCase();
    var textB = b.projectName.toUpperCase();

    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
}

function projectCreatedSorter(a,b) {
    var coercedA = a.created === undefined ? "" : a.created;
    var coercedB = b.created === undefined ? "" : b.created;

    var dateA = coercedA.length === 0 ? Infinity : new Date(coercedA);
    var dateB = coercedB.length === 0 ? Infinity : new Date(coercedB);
    return dateB - dateA;
}

function projectUpdatedSorter(a, b) {
    var coercedA = a.updated === undefined ? "" : a.updated;
    var coercedB = b.updated === undefined ? "" : b.updated;

    var dateA = coercedA.length === 0 ? -1 : new Date(coercedA);
    var dateB = coercedB.length === 0 ? -1 : new Date(coercedB);
    return dateB - dateA;
}

function isFirstTimeBoot(generalConfig) {
    if (generalConfig !== undefined && generalConfig.isFirstTimeBoot !== undefined) {
        return generalConfig.isFirstTimeBoot;
    }

    else {
        return false;
    }
}

function processSelectedTask(selectedTask, focusingTaskListId) {
    if (selectedTask.taskListWidgetId !== focusingTaskListId) {
        return { taskListWidgetId: -1, taskId: -1, isInputOpen: false, isMetadataOpen: false}
    }

    else {
        return selectedTask;
    }
}

function isProjectRemote(state, projectId) {
    var index = state.remoteProjectIds.findIndex(id => { return id === projectId });
    return index !== -1;
}

var getProjectSelectorDueDateDisplaysHelper = function(tasks) {
    var returnList = {};

    tasks.forEach(item => {
        if (item.dueDate !== "" && item.isComplete !== true) {
            // Create an entry in returnList if not already existing.
            if (returnList[item.project] == undefined) {
                returnList[item.project] = { greens: 0, yellows: 0, yellowReds: 0, reds: 0 };
            }

            var { className } = ParseDueDate(item.isComplete, item.dueDate);
            switch (className) {
                case "DueDate Later":
                    returnList[item.project].greens += 1;
                    break;

                case "DueDate Soon":
                    returnList[item.project].yellows += 1;
                    break;

                case "DueDate Today":
                    returnList[item.project].yellowReds += 1;
                    break;

                case "DueDate Overdue":
                    returnList[item.project].reds += 1;
                    break;

                default:
                    break;
            }
        }
    })

    return returnList;
  }