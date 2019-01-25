import * as ActionTypes from '../action-types/index'
import { ParseDueDate, getProjectLayoutType } from '../../pounder-utilities';
import { ProjectLayoutStore } from '../../pounder-stores';
import { AccountConfigFallback, getUserUid } from '../../pounder-firebase';

export function appReducer(state, action) {
    switch (action.type) {
        case ActionTypes.SET_FOCUSED_TASKLIST_ID:
            return { 
                ...state,
                focusedTaskListId: action.id,
                isTaskListJumpMenuOpen: false,
                selectedTask: processSelectedTask(state.selectedTask, action.id),
                openTaskOptionsId: -1,
                enableStates: { ...state.enableStates, newTaskFab: action.id !== -1 }
            };
        
        case ActionTypes.SELECT_TASK:
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

        case ActionTypes.SET_IS_APP_DRAWER_OPEN:
            return {
                ...state,
                isAppDrawerOpen: action.value,
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

        case ActionTypes.SET_TEXT_INPUT_DIALOG:
            return {
                ...state,
                textInputDialog: action.value,
            }
        
        case ActionTypes.LOCAL_PROJECTS:
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
                selectedProjectLayout: getSelectedProjectLayout(state.selectedProjectId, action.members, state.projectLayoutsMap),
                selectedProjectLayoutType: getProjectLayoutType(state.selectedProjectId, action.members, getUserUid()),
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
                projectSelectorIndicators: getProjectSelectorIndicatorsHelper(newTasks),
                openTaskInspectorEntity: updateOpenTaskInspectorEntity(newTasks, state.openTaskInspectorId)
            }

        case ActionTypes.RECEIVE_COMPLETED_LOCAL_TASKS:
        var newTasks = [...state.incompletedLocalTasks, ...action.value, ...state.incompletedRemoteTasks, ...state.completedRemoteTasks];
            return {
                ...state,
                isAwaitingFirebase: false,
                tasks: newTasks,
                completedLocalTasks: action.value,
                openTaskInspectorEntity: updateOpenTaskInspectorEntity(newTasks, state.openTaskInspectorId),
            }

        case ActionTypes.RECEIVE_INCOMPLETED_REMOTE_TASKS:
        var newTasks = [...state.incompletedLocalTasks, ...state.completedLocalTasks, ...action.value, ...state.completedRemoteTasks];
            return {
                ...state,
                isAwaitingFirebase: false,
                tasks: newTasks,
                incompletedRemoteTasks: action.value,
                projectSelectorIndicators: getProjectSelectorIndicatorsHelper(newTasks),
                openTaskInspectorEntity: updateOpenTaskInspectorEntity(newTasks, state.openTaskInspectorId),
            }
        
        case ActionTypes.RECEIVE_COMPLETED_REMOTE_TASKS:
        var newTasks = [...state.incompletedLocalTasks, ...state.completedLocalTasks, ...state.incompletedRemoteTasks, ...action.value]
            return {
                ...state,
                isAwaitingFirebase: false,
                tasks: newTasks,
                completedRemoteTasks: action.value,
                openTaskInspectorEntity: updateOpenTaskInspectorEntity(newTasks, state.openTaskInspectorId)
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
                openChecklistSettingsEntity: updateOpenChecklistSettingsEntity(action.taskLists, state.openChecklistSettingsId)
            }

        case ActionTypes.RECEIVE_REMOTE_TASKLISTS:
            return {
                ...state,
                isAwatingFirebase: false,
                taskLists: [...state.localTaskLists, ...action.taskLists],
                remoteTaskLists: action.taskLists,
                openChecklistSettingsEntity: updateOpenChecklistSettingsEntity(action.taskLists, state.openChecklistSettingsId)
            }
        
        case ActionTypes.START_PROJECTLAYOUTS_FETCH:
            return {
                ...state,
                isAwaitingFirebase: true,
            }

        case ActionTypes.RECEIVE_LOCAL_PROJECTLAYOUTS:
            var projectLayoutsMap = buildProjectLayoutsMap(action.value, state.remoteProjectLayouts);

            return {
                ...state,
                isAwaitingFirebase: false,
                localProjectLayouts: action.value,
                projectLayoutsMap: projectLayoutsMap,
                selectedProjectLayout: getSelectedProjectLayout(state.selectedProjectId, state.members, projectLayoutsMap),
            }

        case ActionTypes.RECEIVE_REMOTE_PROJECTLAYOUTS:
            var projectLayoutsMap = buildProjectLayoutsMap(state.localProjectLayouts, action.value);

            return {
                ...state,
                isAwaitingFirebase: false,
                remoteProjectLayouts: action.value,
                projectLayoutsMap: projectLayoutsMap,
                selectedProjectLayout: getSelectedProjectLayout(state.selectedProjectId, state.members, projectLayoutsMap),
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
                selectedTask: {
                    taskListWidgetId: -1,
                    taskId: -1,
                    isInputOpen: false,
                },
                selectedProjectLayout: getSelectedProjectLayout(action.projectId, state.members, state.projectLayoutsMap),
                selectedProjectLayoutType: getProjectLayoutType(action.projectId, state.members, getUserUid()),
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
                isAppDrawerOpen: action.projectId === -1 ? true : false,
                enableStates: {...state.enableStates, newTaskFab: false}
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
        
        case ActionTypes.OPEN_JUMP_MENU:
            return {
                ...state,
                isJumpMenuOpen: true,
            }
        
        case ActionTypes.CLOSE_JUMP_MENU:
            return {
                ...state,
                isJumpMenuOpen: false,
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
                    projects: maybeReSortProjects(state, action.value), // Returns re sorted projects if generalConfig.sortProjectsBy has changed.
                    selectedMuiThemeId: action.value.selectedMuiThemeId !== undefined ? action.value.selectedMuiThemeId : state.selectedMuiThemeId, 
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

        case ActionTypes.SET_QUICK_ITEM_SELECT_DIALOG: {
            return {
                ...state,
                quickItemSelectDialog: action.value,
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
                enableStates: { ...state.enableStates, newProject: action.value}
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

        case ActionTypes.SET_GENERAL_SNACKBAR: {
            return {
                ...state,
                generalSnackbar: action.value,
                isASnackbarOpen: action.value.isOpen,
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
                projectLayoutsMap: {},
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

        case ActionTypes.RECEIVE_LOCAL_MUI_THEMES: {
            return {
                ...state,
                localMuiThemes: action.value,
                muiThemes: [...action.value]
            }
        }

        case ActionTypes.SELECT_MUI_THEME: {
            return {
                ...state,
                selectedMuiThemeId: action.value,
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

        case ActionTypes.CALCULATE_PROJECT_SELECTOR_INDICATORS: {
            return {
                ...state,
                projectSelectorIndicators: getProjectSelectorIndicatorsHelper(state.tasks),
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
                openTaskInspectorEntity: action.value === -1 ? null : extractTask(state.tasks, action.value),
            }
        
        case ActionTypes.SET_SELECTED_PROJECT_LAYOUT_TYPE:
            return {
                ...state,
                selectedProjectLayoutType: action.value,
                selectedProjectLayout: getSelectedProjectLayout(state.selectedProjectId, state.members, state.projectLayoutsMap)
            }

        case ActionTypes.SET_INFORMATION_DIALOG:
            return {
                ...state,
                informationDialog: action.value,
            }

        case ActionTypes.SET_ITEM_SELECT_DIALOG: {
            return {
                ...state,
                itemSelectDialog: action.value,
            }
        }
        
        case ActionTypes.SET_CONFIRMATION_DIALOG:
            return {
                ...state,
                confirmationDialog: action.value,
            }
        
        case ActionTypes.OPEN_CHECKLIST_SETTINGS:
            return {
                ...state,
                openChecklistSettingsId: action.taskListId,
                openChecklistSettingsEntity: action.existingChecklistSettings,
            }

        case ActionTypes.CLOSE_CHECKLIST_SETTINGS:
            return {
                ...state,
                openChecklistSettingsId: -1,
                openChecklistSettingsEntity: null,
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

function getProjectSelectorIndicatorsHelper(tasks) {
    var returnList = {};

    tasks.forEach(item => {
        var hasUnseenComments = item.unseenTaskCommentMembers !== undefined &&
            item.unseenTaskCommentMembers[getUserUid()] !== undefined;

        if ((item.dueDate !== "" && item.isComplete !== true) || hasUnseenComments) {
            // Create an entry in returnList if not already existing.
            if (returnList[item.project] == undefined) {
                returnList[item.project] = { later: 0, soon: 0, today: 0, overdue: 0, hasUnseenComments: true };
            }

            var { type } = ParseDueDate(item.isComplete, item.dueDate);
            switch (type) {
                case "later":
                    returnList[item.project].later += 1;
                    break;

                case "soon":
                    returnList[item.project].soon += 1;
                    break;

                case "today":
                    returnList[item.project].today += 1;
                    break;

                case "overdue":
                    returnList[item.project].overdue += 1;
                    break;

                default:
                    break;
            }

            returnList[item.project].hasUnseenComments = hasUnseenComments;
        }
    })

    return returnList;
  }

function getSelectedProjectLayout(projectId, members, projectLayoutsMap) {
    if (projectId === -1) {
        return {};
    }

    if (getProjectLayoutType(projectId, members, getUserUid()) === 'global') {
        // Return the Global Layout.
        if (projectLayoutsMap[projectId] !== undefined &&
            projectLayoutsMap[projectId][projectId] !== undefined) {
            return projectLayoutsMap[projectId][projectId];
        }
    }

    else {
        // Return the Users local Layout.
        return projectLayoutsMap[projectId][getUserUid()];
    }
}

  function buildProjectLayoutsMap(localLayouts, remoteLayouts) {
      var localLayoutsMap = {};
      localLayouts.forEach(item => {
          if (localLayoutsMap[item.project] === undefined) { localLayoutsMap[item.project] = {} };

          localLayoutsMap[item.project][item.uid] = item;
      })

      var remoteLayoutsMap = {};
      remoteLayouts.forEach(item => {
          if (remoteLayoutsMap[item.project] === undefined) { remoteLayoutsMap[item.project] = {} };

          remoteLayoutsMap[item.project][item.uid] = item;
      })

      return { ...localLayoutsMap, ...remoteLayoutsMap };
  }

  function extractTask(tasks, taskId) {
      return tasks.find( item => {
          return item.uid === taskId;
      })
  }

  function updateOpenTaskInspectorEntity(tasks, taskId) {
      if (taskId === -1) {
          // Task Inspector isn't open. No Update requried.
          return null;
      }

      else {
          return extractTask(tasks, taskId);
      }
  }

  function updateOpenChecklistSettingsEntity(taskLists, taskListId) {
      if (taskListId === -1) {
          // Checklist Settings isn't open. No update requried;
          return null;
      }

      else {
          let taskList = taskLists.find(item => {
              return item.uid === taskListId;
          })

          if (taskList) {
              return taskList.settings.checklistSettings;
          }

          return null;
      }
  }