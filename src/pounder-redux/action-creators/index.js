import * as ActionTypes from '../action-types/index';
import FirestoreBatchPaginator from '../../firestore-batch-paginator';
import { USERS, PROJECTS, PROJECTLAYOUTS, TASKS, TASKLISTS, ACCOUNT, ACCOUNT_DOC_ID,
     REMOTE_IDS, REMOTES, MEMBERS, INVITES, DIRECTORY, TASKCOMMENTS } from '../../pounder-firebase/paths';
import { setUserUid, getUserUid, TaskCommentQueryLimit } from '../../pounder-firebase';
import { ProjectStore, ProjectLayoutStore, TaskListStore, TaskListSettingsStore, TaskStore, CssConfigStore, MemberStore,
InviteStore, RemoteStore, TaskMetadataStore, DirectoryStore, ProjectFactory, ChecklistSettingsFactory, TaskCommentFactory,
LayoutEntryFactory} from '../../pounder-stores';
import Moment from 'moment';
import { includeMetadataChanges } from '../index';
import parseArgs from 'minimist';
import stringArgv from 'string-argv';
import Fuse from 'fuse.js';
import { getDayPickerDate, getClearedDate, getDaysForwardDate, getWeeksForwardDate, getParsedDate, getNormalizedDate,
isChecklistDueForRenew, isDayName, getDayNameDate, getProjectLayoutType} from '../../pounder-utilities';
var loremIpsum = require('lorem-ipsum');

const legalArgsRegEx = / -dd | -hp /i;
const DATE_FORMAT = 'dddd MMMM Do YYYY, h:mm a';

var newUser = null;

// Database Unsubscribers.
var localProjectsUnsubscribe = null;
var localProjectLayoutsUnsubscribe = null;
var remoteProjectIdsUnsubscribe = null;
var localTaskListsUnsubscribe = null;
var accountConfigUnsubscribe = null;
var invitesUnsubscribe = null;

var onlyCompletedLocalTasksUnsubscribe = null;
var onlyIncompletedLocalTasksUnsubscribe = null;

var remoteProjectsUnsubscribes = {};

// Standard Action Creators.
export function setShowOnlySelfTasks(newValue) {
    return {
        type: ActionTypes.SET_SHOW_ONLY_SELF_TASKS,
        value: newValue,
    }
}

export function cancelTaskMove() {
    return {
        type: ActionTypes.CANCEL_TASK_MOVE,
    }
}

export function setIsInRegisterMode(value) {
    return {
        type: ActionTypes.SET_IS_IN_REGISTER_MODE,
        value: value,
    }
}

export function setOpenProjectSelectorId(projectId) {
    return {
        type: ActionTypes.SET_OPEN_PROJECT_SELECTOR_ID,
        value: projectId,
    }
}

export function setUpdatingUserIds(userIds) {
    return {
        type: ActionTypes.SET_UPDATING_USER_IDS,
        value: userIds,
    }
}

export function setOpenTaskListWidgetHeaderId(taskListId) {
    return {
        type: ActionTypes.SET_OPEN_TASK_LIST_WIDGET_HEADER_ID,
        value: taskListId,
    }
}

export function setFloatingTextInput(isOpen, currentText, targetType, niceTargetName, targetId) {
    return {
        type: ActionTypes.SET_FLOATING_TEXT_INPUT,
        value: { isOpen: isOpen, currentText: currentText, targetType: targetType, niceTargetName: niceTargetName, targetId: targetId}
    }
}

export function setOpenTaskOptionsId(taskId) {
    return {
        type: ActionTypes.SET_OPEN_TASK_OPTIONS_ID,
        value: taskId,
    }
}

export function receiveMembers(members) {
    return {
        type: ActionTypes.RECEIVE_MEMBERS,
        members: members,
    }
}

export function receiveInvites(invites) {
    return {
        type: ActionTypes.RECEIVE_INVITES,
        invites: invites,
    }
}

export function receiveRemoteProjects(projects) {
    return {
        type: ActionTypes.RECEIVE_REMOTE_PROJECTS,
        projects: projects,
    }
}

export function setDisplayName(displayName) {
    return {
        type: ActionTypes.SET_DISPLAY_NAME,
        value: displayName,
    }
}

export function setShareMenuMessage(message) {
    return {
        type: ActionTypes.SET_SHARE_MENU_MESSAGE,
        value: message,
    }
}

export function setShareMenuSubMessage(message) {
    return {
        type: ActionTypes.SET_SHARE_MENU_SUB_MESSAGE,
        value: message,
    }
}

export function setIsShareMenuWaiting(value) {
    return {
        type: ActionTypes.SET_IS_SHARE_MENU_WAITING,
        value: value,
    }
}

export function setIsShareMenuOpen(isOpen) {
    return {
        type: ActionTypes.SET_IS_SHARE_MENU_OPEN,
        value: isOpen,
    }
}
export function setIsSidebarOpen(isOpen) {
    return {
        type: ActionTypes.SET_IS_SIDEBAR_OPEN,
        value: isOpen,
    }
}
export function clearData() {
    return {
        type: ActionTypes.CLEAR_DATA,
    }
}

export function openTaskInfo(taskId) {
    return {
        type: ActionTypes.OPEN_TASK_INFO,
        value: taskId,
    }
}

export function dismissSnackbar() {
    return {
        type: ActionTypes.DISMISS_SNACKBAR,
    }
}

export function postSnackbarMessage(message, isSelfDismissing, type) {
    return {
        type: ActionTypes.POST_SNACKBAR_MESSAGE,
        message: message,
        isSelfDismissing: isSelfDismissing,
        snackbarType: type,
    }
}

export function setIsLoggedInFlag(isLoggedIn) {
    return {
        type: ActionTypes.SET_IS_LOGGED_IN_FLAG,
        value: isLoggedIn,
    }
}

export function setUserEmail(email) {
    return {
        type: ActionTypes.SET_USER_EMAIL,
        value: email,
    }
}

export function setIsLoggingInFlag(isLoggingIn) {
    return {
        type: ActionTypes.SET_IS_LOGGING_IN_FLAG,
        value: isLoggingIn,
    }
}

export function setAuthStatusMessage(message) {
    return {
        type: ActionTypes.SET_AUTH_STATUS_MESSAGE,
        value: message,
    }
}

export function setMessageBox(isOpen, message, type, dataStore, closeCallback) {
    return {
        type: ActionTypes.SET_MESSAGE_BOX,
        value: {
            isOpen: isOpen,
            message: message,
            type: type,
            closeCallback: closeCallback,
        }
    }
}

export function receiveCSSConfig(config) {
    return {
        type: ActionTypes.RECEIVE_CSS_CONFIG,
        value: config,
    }
}
export function setIgnoreFullscreenTriggerFlag(value) {
    return {
        type: ActionTypes.SET_IGNORE_FULLSCREEN_TRIGGER_FLAG,
        value: value,
    }
}

export function receiveAccountConfig(accountConfig) {
    return {
        type: ActionTypes.RECEIVE_ACCOUNT_CONFIG,
        value: accountConfig,
    }
}

export function setIsAppSettingsOpen(isOpen) {
    return {
        type: ActionTypes.SET_IS_APP_SETTINGS_OPEN,
        value: isOpen,
    }
}

export function setIsDexieConfigLoadComplete(isComplete) {
    return {
        type: ActionTypes.SET_IS_DEXIE_CONFIG_LOAD_COMPLETE_FLAG,
        value: isComplete
    }
}

export function setIsDatabaseRestoringFlag(isRestoring) {
    return {
        type: ActionTypes.SET_IS_DATABASE_RESTORING_FLAG,
        value: isRestoring,
    }
}

export function setIsStartingUpFlag(isStartingUp) {
    return {
        type: ActionTypes.SET_IS_STARTING_UP_FLAG,
        value: isStartingUp
    }
}

export function setIsRestoreDatabaseCompleteDialogOpen(isOpen) {
    return {
        type: ActionTypes.SET_IS_RESTORE_DATABASE_COMPLETE_DIALOG_OPEN,
        value: isOpen,
    }
}

export function setDatabasePurgingFlag(isPurging) {
    return {
        type: ActionTypes.SET_DATABASE_PURGING_FLAG,
        value: isPurging
    }
}

export function setDatabaseInfo(info) {
    return {
        type: ActionTypes.SET_DATABASE_INFO,
        value: info,
    }
}

export function setAppSettingsMenuPage(pageName) {
    return {
        type: ActionTypes.SET_APP_SETTINGS_MENU_PAGE,
        value: pageName
    }
}

export function setIsShuttingDownFlag(isShuttingDown) {
    return {
        type: ActionTypes.SET_IS_SHUTTING_DOWN_FLAG,
        value: isShuttingDown
    }
}

export function changeFocusedTaskList(id) {
    return {
        type: ActionTypes.CHANGE_FOCUSED_TASKLIST,
        id: id
    }
}

export function selectTask(taskListWidgetId, taskId, openMetadata) {
    return {
        type: ActionTypes.SELECT_TASK,
        taskListWidgetId: taskListWidgetId,
        taskId: taskId,
        openMetadata: openMetadata,
    }
}

export function openTask(taskListWidgetId, taskId) {
    return {
        type: ActionTypes.OPEN_TASK,
        taskListWidgetId: taskListWidgetId,
        taskId: taskId
    }
}

export function closeTask(taskListWidgetId, taskId) {
    return {
        type: ActionTypes.CLOSE_TASK,
        taskListWidgetId: taskListWidgetId,
        taskId: taskId
    }
}

export function startTaskMove(movingTaskId, sourceTaskListWidgetId) {
    return {
        type: ActionTypes.START_TASK_MOVE,
        movingTaskId: movingTaskId,
        sourceTaskListWidgetId: sourceTaskListWidgetId
    }
}

export function startTaskMoveInDatabase() {
    return {
        type: ActionTypes.START_TASK_MOVE_IN_DATABASE
    }
}

export function startProjectsFetch() {
    return {
        type: ActionTypes.START_PROJECTS_FETCH,
    }
}

export function receiveLocalProjects(projects) {
    return {
        type: ActionTypes.RECEIVE_LOCAL_PROJECTS,
        projects: projects
    }
}

export function startTasksFetch() {
    return {
        type: ActionTypes.START_TASKS_FETCH
    }
}

export function lockApp() {
    return {
        type: ActionTypes.LOCK_APP,
    }
}

export function unlockApp() {
    return {
        type: ActionTypes.UNLOCK_APP,
    }
}

export function setLastBackupDate(date) {
    return {
        type: ActionTypes.SET_LAST_BACKUP_DATE,
        value: date,
    }
}

export function setOpenTaskListSettingsMenuId(id) {
    return {
        type: ActionTypes.SET_OPEN_TASKLIST_SETTINGS_MENU_ID,
        id: id
    }
}

export function setUpdatingInviteIds(updatingInviteIds) {
    return {
        type: ActionTypes.SET_UPDATING_INVITE_IDS,
        value: updatingInviteIds,
    }
}

export function startTasklistAdd() {
    return {
        type: ActionTypes.START_TASKLIST_ADD
    }
}

export function startTaskAdd() {
    return {
        type: ActionTypes.START_TASK_ADD
    }
}

export function startTaskListsFetch() {
    return {
        type: ActionTypes.START_TASKLISTS_FETCH
    }
}

export function receiveLocalTaskLists(taskLists) {
    return {
        type: ActionTypes.RECEIVE_LOCAL_TASKLISTS,
        taskLists: taskLists
    }
}

export function receiveRemoteTaskLists(taskLists) {
    return {
        type: ActionTypes.RECEIVE_REMOTE_TASKLISTS,
        taskLists: taskLists,
    }
}

export function startProjectLayoutsFetch() {
    return {
        type: ActionTypes.START_PROJECTLAYOUTS_FETCH
    }
}

export function receiveLocalProjectLayouts(projectLayouts) {
    return {
        type: ActionTypes.RECEIVE_LOCAL_PROJECTLAYOUTS,
        value: projectLayouts
    }
}

export function receiveRemoteProjectLayouts(projectLayouts) {
    return {
        type: ActionTypes.RECEIVE_REMOTE_PROJECTLAYOUTS,
        value: projectLayouts
    }
}

export function setProjectsHavePendingWrites(value) {
    return {
        type: ActionTypes.SET_PROJECTS_HAVE_PENDING_WRITES,
        value: value
    }
}

export function setProjectLayoutsHavePendingWrites(value) {
    return {
        type: ActionTypes.SET_PROJECTLAYOUTS_HAVE_PENDING_WRITES,
        value: value
    }
}

export function setTaskListsHavePendingWrites(value) {
    return {
        type: ActionTypes.SET_TASKLISTS_HAVE_PENDING_WRITES,
        value: value
    }
}

export function setTasksHavePendingWrites(value) {
    return {
        type: ActionTypes.SET_TASKS_HAVE_PENDING_WRITES,
        value: value,
    }
}

export function openTaskListJumpMenu() {
    return {
        type: ActionTypes.OPEN_TASK_LIST_JUMP_MENU,
    }
}

export function closeTaskListJumpMenu() {
    return {
        type: ActionTypes.CLOSE_TASK_LIST_JUMP_MENU,
    }
}

export function receiveGeneralConfig(config) {
    return {
        type: ActionTypes.RECEIVE_GENERAL_CONFIG,
        value: config
    }
}

export function receiveRemoteProjectIds(ids) {
    return {
        type: ActionTypes.RECEIVE_REMOTE_PROJECT_IDS,
        value: ids
    }
}

export function setShowCompletedTasks(value) {
    return {
        type: ActionTypes.SET_SHOW_COMPLETED_TASKS,
        value: value,
    }
}

export function receiveIncompletedLocalTasks(value) {
    return {
        type: ActionTypes.RECEIVE_INCOMPLETED_LOCAL_TASKS,
        value: value,
    }
}

export function receiveCompletedLocalTasks(value) {
    return {
        type: ActionTypes.RECEIVE_COMPLETED_LOCAL_TASKS,
        value: value,
    }
}

export function receiveIncompletedRemoteTasks(value) {
    return {
        type: ActionTypes.RECEIVE_INCOMPLETED_REMOTE_TASKS,
        value: value,
    }
}

export function receiveCompletedRemoteTasks(value) {
    return {
        type: ActionTypes.RECEIVE_COMPLETED_REMOTE_TASKS,
        value: value,
    }
}

export function selectProject(projectId) {
    return {
        type: ActionTypes.SELECT_PROJECT,
        projectId: projectId
    }
}

export function setIsProjectMenuOpen(isOpen) {
    return {
        type: ActionTypes.SET_IS_PROJECT_MENU_OPEN,
        value: isOpen,
    }
}

export function calculateProjectSelectorIndicators() {
    return {
        type: ActionTypes.CALCULATE_PROJECT_SELECTOR_INDICATORS
    }
}

export function setIsUpdateSnackbarOpen(isOpen) {
    return {
        type: ActionTypes.SET_IS_UPDATE_SNACKBAR_OPEN,
        value: isOpen,
    }
}

export function startTaskCommentsGet() {
    return {
        type: ActionTypes.START_TASK_COMMENTS_GET,
    }
}

export function receiveTaskComments(comments) {
    return {
        type: ActionTypes.RECEIVE_TASK_COMMENTS,
        value: comments,
    }
}

export function setPendingTaskCommentIds(ids) {
    return {
        type: ActionTypes.SET_PENDING_TASK_COMMENT_IDS,
        value: ids,
    }
}

export function setIsTaskCommentsPaginating(isPaginating) {
    return {
        type: ActionTypes.SET_IS_TASK_COMMENTS_PAGINATING,
        value: isPaginating,
    }
}

export function setIsAllTaskCommentsFetched(isFetched) {
    return {
        type: ActionTypes.SET_IS_ALL_TASK_COMMENTS_FETCHED,
        value: isFetched,
    }
}

export function setSelectedProjectLayoutType(layoutType) {
    return {
        type: ActionTypes.SET_SELECTED_PROJECT_LAYOUT_TYPE,
        value: layoutType,
    }
}

// Private Actions.
// Should only be dispatched by moveTaskAsync(), as moveTaskAsync() gets the movingTaskId from the State. Calling this from elsewhere
// could create a race Condition.
function setOpenTaskInspectorId(taskId) {
    return {
        type: ActionTypes.SET_OPEN_TASK_INSPECTOR_ID,
        value: taskId,
    }
}

function endTaskMove(movingTaskId, destinationTaskListWidgetId) {
    return {
        type: ActionTypes.END_TASK_MOVE,
        movedTaskId: movingTaskId,
        destinationTaskListWidgetId: destinationTaskListWidgetId,
    }
}

// Thunks
export function updateProjectLayoutTypeAsync(projectLayoutType) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        var selectedProjectId = getState().selectedProjectId;

        if (isProjectRemote(getState, selectedProjectId) === true) {
            var batch = getFirestore().batch();

            var memberRef = getFirestore().collection(REMOTES).doc(selectedProjectId).collection(MEMBERS).doc(getUserUid());
            batch.update(memberRef, { projectLayoutType: projectLayoutType } );

            if (hasUserGotALocalLayout(getState()) === false) {
                // If user has not already been in "Local" project layout mode. Create a new Layout entry for them.
                var projectLayoutRef = getProjectLayoutRef(getFirestore, getState, selectedProjectId).doc(getUserUid());
                var existingLayouts = getState().selectedProjectLayout.layouts;

                batch.set(projectLayoutRef, {...new ProjectLayoutStore(existingLayouts, selectedProjectId, getUserUid() )});
            }

            batch.commit().then( () => {
                // Success
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })

            // Update State.
            dispatch(setSelectedProjectLayoutType(projectLayoutType));
        }
    }
}


export function openTaskInspectorAsync(taskId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(setOpenTaskInspectorId(taskId));
        dispatch(getTaskCommentsAsync(taskId));
    }
}

export function closeTaskInspectorAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        // Save some Info before it is destroyed by the closeTaskInfo() Action.
        var openTaskInspectorId = getState().openTaskInspectorId;
        var taskComments = [...getState().taskComments];

        dispatch(setOpenTaskInspectorId(-1));
        dispatch(setIsAllTaskCommentsFetched(false));

        // Add User ID to Seenby of any Unseen Task Comments.
        var selectedProjectId = getState().selectedProjectId;
        if (isProjectRemote(getState, selectedProjectId) === true) {
            var batch = getFirestore().batch();
            var unseenCommentsFound = false;

            taskComments.forEach(comment => {
                var isUnseen = !comment.seenBy.some(id => {
                    return id === getUserUid();
                })

                if (isUnseen === true) {
                    unseenCommentsFound = true;

                    var ref = getFirestore().collection(REMOTES).doc(selectedProjectId).collection(TASKS)
                        .doc(openTaskInspectorId).collection(TASKCOMMENTS).doc(comment.uid);

                    var newSeenBy = comment.seenBy;
                    newSeenBy.push(getUserUid());

                    batch.update(ref, { seenBy: newSeenBy });
                }
            })

            batch.commit().then(() => {
                // Success
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })

            // Update Task.unseenTaskCommentMembers if unseen Comments have been found.
            if (unseenCommentsFound === true) {
                var taskRef = getFirestore().collection(REMOTES).doc(selectedProjectId).collection(TASKS)
                    .doc(openTaskInspectorId);

                taskRef.get().then(doc => {
                    if (doc.exists) {
                        // Filter out current User from unseenCommentMembers.
                        var currentUnseenCommentMembers = doc.data().unseenTaskCommentMembers;
                        var newUnseenCommentMembers = {};
                        for (var propertyName in currentUnseenCommentMembers) {
                            if (propertyName !== getUserUid()) {
                                newUnseenCommentMembers[propertyName] = "0";
                            }
                        }

                        taskRef.update({
                            unseenTaskCommentMembers: newUnseenCommentMembers,
                        }).then(() => {

                        }).catch(error => {
                            handleFirebaseUpdateError(error, getState(), dispatch);
                        })
                    }
                }).catch(error => {
                    handleFirebaseSnapshotError(error, getState(), dispatch);
                })
            }
        }
    }
}

export function getTaskCommentsAsync(taskId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        var selectedProjectId = getState().selectedProjectId;
            dispatch(startTaskCommentsGet());

            var ref = getTaskRef(getFirestore, getState, taskId).collection(TASKCOMMENTS)
            .orderBy("timestamp", "desc").limit(TaskCommentQueryLimit + 1);

            ref.get().then( snapshot => {
                handleTaskCommentsSnapshot("initial", snapshot, dispatch);
            }).catch(error => {
                handleFirebaseSnapshotError(error, getState(), dispatch, getState );
            })
    }
}

export function paginateTaskCommentsAsync(taskId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        if (getState().taskComments.length > 0) {
            var selectedProjectId = getState().selectedProjectId;
            var previousQueryLastDoc = getState().taskComments[getState().taskComments.length - 1].doc;

            if (previousQueryLastDoc !== undefined) {
                dispatch(setIsTaskCommentsPaginating(true));

                var ref = getTaskRef(getFirestore, getState, taskId).collection(TASKCOMMENTS)
                    .orderBy("timestamp", "desc").startAfter(previousQueryLastDoc).limit(TaskCommentQueryLimit + 1);

                ref.get().then(snapshot => {
                    handleTaskCommentsSnapshot("pagination", snapshot, dispatch, getState);
                    dispatch(setIsTaskCommentsPaginating(false));

                }).catch(error => {
                    handleFirebaseSnapshotError(error, getState(), dispatch, getState);
                })
            }
        }

    }
}

export function deleteTaskCommentAsync(taskId, commentId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        var selectedProjectId = getState().selectedProjectId;

        var ref = getTaskRef(getFirestore, getState, taskId).collection(TASKCOMMENTS).doc(commentId);

        ref.delete().then(() => {
            // Success
        }).catch(error => {
            handleFirebaseUpdateError(error, getState(), dispatch);
        })

        // Update State.
        var newTaskComments = getState().taskComments.filter( item => {
            return item.uid !== commentId;
        })

        dispatch(receiveTaskComments(newTaskComments));
    }
}

function handleTaskCommentsSnapshot(type, snapshot, dispatch, getState) {

        // Determine based on the Snapshot Size if the Query has retreived all of the Task Comments.
        // Problem is however that if the Query Size matches the TaskCommentsQueryLimit, there are edge cases where
        // there could be no more Commments. As in the total size of the Comments collection is evenly divisable by the
        // TaskCOmmentsQueryLimit.. You could try actually fetching the TaskCommentsQueryLimit + 1 and using the extra one
        // to determine if the Query is finished whilst still only showing the TaskCommentsQueryLimit to the user.

        var taskComments = [];
        var counter = 0;
        snapshot.forEach(doc => {
            // Take only enough Comments to equalt TaskCommentQueryLimit. comment[TaskCommentQueryLimit + 1] is only used to
            // determine if Pagination is completed.
            if (counter < TaskCommentQueryLimit) {
                var comment = {
                    doc: doc,
                    isSynced: !doc.metadata.hasPendingWrites,
                    ...doc.data(),
                }

                taskComments.push(comment);
                counter++;
            }            
        })

        if (snapshot.size < TaskCommentQueryLimit + 1) {
            dispatch(setIsAllTaskCommentsFetched(true));
        } 

        if (type === "initial") {
            // Send to state as is.
            dispatch(receiveTaskComments(taskComments));
        }

        if (type === "pagination") {
            // Concat with existing Task Comments.
            var mergedTaskComments = [...getState().taskComments, ...taskComments ];

            dispatch(receiveTaskComments(mergedTaskComments));
        }
        
        
}

export function postNewCommentAsync(taskId, value) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        var selectedProjectId = getState().selectedProjectId;

        var mentions = [];
        var created = Moment().toISOString();
        var createdBy = getUserUid();
        var displayName = getState().displayName;
        var seenBy = [createdBy];
        var newCommentRef = getTaskRef(getFirestore, getState, taskId).collection(TASKCOMMENTS).doc();

        var taskComment = TaskCommentFactory(newCommentRef.id, value, mentions, created, createdBy, seenBy, displayName);

        newCommentRef.set(taskComment).then(() => {
            // Success. Update newly posted comment's isSynced flag.
            var commentIndex = getState().taskComments.findIndex(item => {
                return item.uid === newCommentRef.id;
            })

            if (commentIndex !== -1) {
                var comments = [...getState().taskComments];
                comments[commentIndex].isSynced = true;

                dispatch(receiveTaskComments(comments));
            }

        }).catch(error => {
            handleFirebaseUpdateError(error, getState(), dispatch);
        })

        // Add to State.
        var existingComments = [...getState().taskComments];
        existingComments.push({ isSynced: false, ...taskComment });
        dispatch(receiveTaskComments(existingComments));

        // Add a Hashtable to Task to indicate the User ID's that have unseen Comments.
        // Also add a flag to indicate this Task may have Comments. This helps the Migration Functions.
        var unseenMembersArray = getState().members.filter(item => {
            return item.project === selectedProjectId && item.userId !== createdBy;
        })

        var unseenMembers = {};
        unseenMembersArray.forEach(item => {
            unseenMembers[item.userId] = "0";
        })

        var taskRef = getTaskRef(getFirestore, getState, taskId);
        taskRef.update({
            unseenTaskCommentMembers: unseenMembers,
            mightHaveTaskComments: true,
        }).then(() => {
            // Success
        }).catch(error => {
            handleFirebaseUpdateError(error, getState(), dispatch);
        })
    }
}


export function renewChecklistAsync(taskList, isRemote, projectId, userTriggered) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        var taskListId = taskList.uid;

        var tasksCollectionRef = isRemote === true ?
        getFirestore().collection(REMOTES).doc(projectId).collection(TASKS) :
        getFirestore().collection(USERS).doc(getUserUid()).collection(TASKS);

        tasksCollectionRef.where("taskList", "==", taskListId).get().then( snapshot => {
            var taskRefs = [];
            snapshot.forEach(doc => {
                taskRefs.push(doc.ref);
            })

            var batch = getFirestore().batch();
            
            taskRefs.forEach(ref => {
                batch.update(ref, { isComplete: false });
            })

            // Update the settings to represent the next requested renew Time, but only if this wasn't triggered by the user.
            // User triggering could be from the "Renew Now" button. 
            if (userTriggered !== true) {
                var taskListRef = isRemote === true ?
                    getFirestore().collection(REMOTES).doc(projectId).collection(TASKLISTS).doc(taskListId) :
                    getFirestore().collection(USERS).doc(getUserUid()).collection(TASKLISTS).doc(taskListId);

                var newChecklistSettings = { ...taskList.settings.checklistSettings, lastRenewDate: getNormalizedDate(Moment()) };
                var newTaskListSettings = { ...taskList.settings, checklistSettings: newChecklistSettings };

                batch.update(taskListRef, { settings: newTaskListSettings });
            }
            
            batch.commit().then( () => {
                // Success
            })
            
        })
    }
}

function getNewRenewDate(currentRenewDate, renewInterval) {
    var newRenewMoment = Moment(currentRenewDate).add(renewInterval, 'days');

    return getNormalizedDate(newRenewMoment);
}

export function setShowCompletedTasksAsync(showCompletedTasks) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        if (showCompletedTasks !== getState().showCompletedTasks) {
            dispatch(setShowCompletedTasks(showCompletedTasks))

            if (showCompletedTasks) {
                // Local
                dispatch(getCompletedLocalTasksAsync());

                // Remote.
                if (getState().isSelectedProjectRemote) {
                    var selectedProjectId = getState().selectedProjectId;
                    var remoteProjectUnsubscribe = remoteProjectsUnsubscribes[selectedProjectId];
                    
                    if (remoteProjectUnsubscribe !== undefined) {
                        remoteProjectUnsubscribe.onlyCompletedTasks = getCompletedRemoteTasks(getFirestore, getState, dispatch, selectedProjectId);
                    }
                }
            }

            else {
                unsubscribeCompletedTasks();
                dispatch(receiveCompletedLocalTasks([]));
                dispatch(receiveCompletedRemoteTasks([]));
            }
        }
    }
}

function unsubscribeCompletedTasks() {
    // Local.
    // Unsubscribe from changes and Clear Local State.
    if (onlyCompletedLocalTasksUnsubscribe !== null) {
        onlyCompletedLocalTasksUnsubscribe();
    }

    // Remote.
    // Unsubscribe from changes and clear Local state.
    /*
        Why unsubscribe from every remote project? We are trying to avoid having to use getState or getFirestore so that we can
        consume this method outside of a Thunk.
    */
    for (var projectId in remoteProjectsUnsubscribes) {
        if (remoteProjectsUnsubscribes[projectId].onlyCompletedTasks !== null) {
            remoteProjectsUnsubscribes[projectId].onlyCompletedTasks();
        }
    }
}

export function updateTaskNoteAsync(newValue, oldValue, taskId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {

        if (oldValue !== newValue) {
            var taskRef = getTaskRef(getFirestore, getState, taskId);

            taskRef.update({ 
                note: newValue,
                metadata: getUpdatedMetadata(extractCurrentMetadata(getState(), taskId), { updatedBy: getState().displayName, updatedOn: getHumanFriendlyDate() })
             }).then(() => {
                // Careful what you do here, Promises don't resolve Offline.
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })

            // Project updated metadata.
            updateProjectUpdatedTime(getState, getFirestore, getState().selectedProjectId);
        }
    }
}

export function updateTaskAssignedToAsync(newUserId, oldUserId, taskId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(setOpenTaskInspectorId(-1));

        if (newUserId !== oldUserId) {
            var taskRef = getTaskRef(getFirestore, getState, taskId);

            taskRef.update({ assignedTo: newUserId }).then(() => {
                // Careful what you do here, Promises don't resolve Offline.
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })

            // Project updated metadata.
            updateProjectUpdatedTime(getState, getFirestore, getState().selectedProjectId);
        }
    }
}

export function sendPasswordResetEmailAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        var email = getState().userEmail;

        getAuth().sendPasswordResetEmail(email).then( () => {
            dispatch(postSnackbarMessage("Password reset email sent.", true, 'affirmative-notification'));
        }).catch(error => {
            dispatch(postSnackbarMessage("An error occured: " + error.message, false, 'error'));
        })
    }
}

export function registerNewUserAsync(email, password, displayName) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {

        if (displayName === "") {
            dispatch(postSnackbarMessage("Please enter a display name", true, 'negative-notification'));
        }

        else {
            dispatch(setIsLoggingInFlag(true));
            var parsedEmail = email.toLowerCase().trim();

            // Save the users details so they can be pushed to the Directory once they are logged in. This is because we can't set
            // a cloud function trigger to watch for a profile update, we also can't provide the display name along with the
            // createUserWithEmailAndPassword function, so this is the current best way to set a directory entry without concurrency
            // issues.
            newUser = { email: parsedEmail, displayName: displayName };

            getAuth().createUserWithEmailAndPassword(parsedEmail, password).then(() => {
                // Push their desired Display name to Authentication.
                getAuth().currentUser.updateProfile({ displayName: displayName }).then( () => {
                    dispatch(setDisplayName(displayName));

                }).catch(error => {
                    handleFirebaseUpdateError(error, getState(), dispatch);
                    newUser = null;
                })


            }).catch(error => {
                handleAuthError(dispatch, error);
                dispatch(setIsLoggingInFlag(false));

            })
        }
    }
}

function clearFirstTimeBootFlag(dispatch, getState) {
    var generalConfig = getState().generalConfig;
    generalConfig.isFirstTimeBoot = false;

    dispatch(setGeneralConfigAsync(generalConfig));
}

export function acceptProjectInviteAsync(projectId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        addUpdatingInviteId(dispatch, getState, projectId);

        var acceptProjectInvite = getFunctions().httpsCallable('acceptProjectInvite');
        acceptProjectInvite({projectId: projectId}).then( () => {
            var inviteRef = getFirestore().collection(USERS).doc(getUserUid()).collection(INVITES).doc(projectId);
            inviteRef.delete().then( () => {
                // Success.
                removeUpdatingInviteId(dispatch, getState, projectId);
            }).catch(error => {
                dispatch(handleFirebaseUpdateError(error, getState(), dispatch));
                removeUpdatingInviteId(dispatch, getState, projectId);
            })

        }).catch(error => {
            var message = `An Error occured, are you sure you are connected to the internet? Error Message : ${error.message}`; 
            dispatch(postSnackbarMessage(message, true, 'infomation' ));
            removeUpdatingInviteId(dispatch, getState, projectId);
        })
    }
}

export function denyProjectInviteAsync(projectId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        addUpdatingInviteId(dispatch, getState, projectId);
        
        // Success.
        var denyProjectInvite = getFunctions().httpsCallable('denyProjectInvite');
        denyProjectInvite({projectId: projectId}).then( result => {
            if (result.data.status === 'error') {
                dispatch(postSnackbarMessage(result.data.message, false, 'error'));
                removeUpdatingInviteId(dispatch, getState, projectId);
            }

            else {
                // Success.
                var inviteRef = getFirestore().collection(USERS).doc(getUserUid()).collection(INVITES).doc(projectId);
                inviteRef.delete().then(() => {
                    removeUpdatingInviteId(dispatch, getState, projectId);
                }).catch(error => {
                    dispatch(handleFirebaseUpdateError(error, getState(), dispatch));
                })
            }
        }).catch(error => {
            var message = `An Error occured, are you sure you are connected to the internet? Error Message : ${error.message}`; 
            dispatch(postSnackbarMessage(message, true, 'infomation'));
            removeUpdatingInviteId(dispatch, getState, projectId);
        })
    }
}


export function getRemoteProjectIdsAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        getFirestore().collection(USERS).doc(getUserUid()).collection(REMOTE_IDS).onSnapshot( snapshot => {
            if (snapshot.docChanges().length > 0) {
                var remoteProjectIds = []

                snapshot.forEach(doc => {
                    remoteProjectIds.push(doc.data().projectId);
                })

                dispatch(receiveRemoteProjectIds(remoteProjectIds));

                snapshot.docChanges().forEach(change => {
                    if (change.type === "added") {
                        dispatch(subscribeToRemoteProjectAsync(change.doc.data().projectId));
                    }

                    if (change.type === "removed") {
                        dispatch(unsubscribeFromRemoteProjectAsync(change.doc.data().projectId));
                    }
                });
        
            }
        }, error => {
            handleFirebaseSnapshotError(error, getState(), dispatch);
        })
    }
}

export function subscribeToRemoteProjectAsync(projectId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        // Top Level Project Info.
        var projectUnsubscribe = getFirestore().collection(REMOTES).doc(projectId).onSnapshot( doc => {
            if (doc.exists) {
                var projectName = doc.get('projectName');
                var members = doc.get('members');
                var created = doc.get('created');
                var updated = doc.get('updated');

                var filteredProjects = getState().remoteProjects.filter(item => {
                    return item.uid !== doc.id;
                })

                filteredProjects.push({
                    projectName: projectName,
                    members: members,
                    uid: doc.id,
                    isRemote: true,
                    created: created,
                    updated: updated
                });

                dispatch(receiveRemoteProjects(filteredProjects));
            }
        })

        // Members.
        var membersUnsubscribe = getFirestore().collection(REMOTES).doc(projectId).collection(MEMBERS).onSnapshot(snapshot => {
            handleMembersSnapshot(getState, dispatch, snapshot, projectId);
        })

        // TaskLists.
        var taskListsUnsubscribe = getFirestore().collection(REMOTES).doc(projectId).collection(TASKLISTS).onSnapshot(includeMetadataChanges, snapshot => {
            handleTaskListsSnapshot(getState, dispatch, true, snapshot, projectId);
        })

        // Tasks.
        // Always get Incompleted Tasks.
        var onlyIncompletedRemoteTasksUnsubscribe = getIncompletedRemoteTasks(getFirestore, getState, dispatch, projectId);

        // Only get completed tasks if we have to.
        var onlyCompletedRemoteTasksUnsubscribe = getState().showCompletedTasks ? 
        getCompletedRemoteTasks(getFirestore, getState, dispatch, projectId) : null;
        

        // ProjectLayout.
        var projectLayoutUnsubscribe = getFirestore().collection(REMOTES).doc(projectId).collection(PROJECTLAYOUTS).onSnapshot(includeMetadataChanges, snapshot => {
            handleProjectLayoutsSnapshot(getState, dispatch, true, snapshot, projectId);
        })

        remoteProjectsUnsubscribes[projectId] = {
            project: projectUnsubscribe,
            members: membersUnsubscribe,
            taskLists: taskListsUnsubscribe,
            onlyIncompletedTasks: onlyIncompletedRemoteTasksUnsubscribe,
            onlyCompletedTasks: onlyCompletedRemoteTasksUnsubscribe,
            projectLayout: projectLayoutUnsubscribe,
        }
    }
}

function getCompletedRemoteTasks(getFirestore, getState, dispatch, projectId) {
    return getFirestore().collection(REMOTES).doc(projectId).collection(TASKS).where('isComplete', '==', true).orderBy('project').onSnapshot(includeMetadataChanges, snapshot => {
        handleTasksSnapshot(getState, dispatch, true, snapshot, projectId, 'completedOnly');
    })
}

function getIncompletedRemoteTasks(getFirestore, getState, dispatch, projectId) {
    return getFirestore().collection(REMOTES).doc(projectId).collection(TASKS).where('isComplete', '==', false).orderBy('project').onSnapshot(includeMetadataChanges, snapshot => {
        handleTasksSnapshot(getState, dispatch, true, snapshot, projectId, 'incompletedOnly');
    })
}
 

function handleMembersSnapshot(getState, dispatch, snapshot, projectId) {
    if (snapshot.docChanges().length > 0) {
        var currentMembers = getState().members;

        var filteredMembers = currentMembers.filter(item => {
            return item.project !== projectId;
        })

        snapshot.forEach(doc => {
            filteredMembers.push(doc.data());
        })

        dispatch(receiveMembers(filteredMembers));
    }
}

export function unsubscribeFromRemoteProjectAsync(projectId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        // Project.
        remoteProjectsUnsubscribes[projectId].project;
        
        // Extract and remove from State.
        var remoteProjects = getState().remoteProjects.filter(item => {
            return item.uid !== projectId;
        })
        dispatch(receiveRemoteProjects(remoteProjects));

        // Members.
        remoteProjectsUnsubscribes[projectId].members();

        // Extract and remove from state.
        var filteredMembers = getState().members.filter(item => {
            return item.project !== projectId;
        })
        dispatch(receiveMembers(filteredMembers));
        
        // TaskLists.
        remoteProjectsUnsubscribes[projectId].taskLists();

        // Extract and remove from state.
        var taskLists = getState().remoteTaskLists.filter(item => {
            return item.project !== projectId;
        })
        dispatch(receiveRemoteTaskLists(taskLists));

        // Tasks.
        if (remoteProjectsUnsubscribes[projectId].onlyIncompletedTasks !== null) { remoteProjectsUnsubscribes[projectId].onlyIncompletedTasks() }
        if (remoteProjectsUnsubscribes[projectId].onlyCompletedTasks !== null) { remoteProjectsUnsubscribes[projectId].onlyCompletedTasks }
        
        // Extract and remove from state.
        var incompletedTasks = getState().incompletedRemoteTasks.filter(item => {
            return item.project !== projectId;
        })
        dispatch(receiveIncompletedRemoteTasks(incompletedTasks));

        if (getState().showCompletedTasks) {
            var completedTasks = getState().completedRemoteTasks.filter(item => {
                return item.project !== projectId;
            })
        dispatch(receiveCompletedRemoteTasks(completedTasks));
        }

        // ProjectLayout.
        remoteProjectsUnsubscribes[projectId].projectLayout();

        // Extract and remove from state.
        var projectLayouts = getState().remoteProjectLayouts.filter(item => {
            return item.project !== projectId;
        })
        dispatch(receiveRemoteProjectLayouts(projectLayouts));
    }
}

export function migrateProjectBackToLocalAsync(projectId, projectName) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        // Extract project from State before you unsubscribe from Database.
        var project = extractProject(getState, projectId);

        dispatch(setIsShareMenuWaiting(true));
        dispatch(setShareMenuMessage("Migrating project."))
        dispatch(setShowCompletedTasksAsync(false));
        dispatch(selectProject(-1));

        var kickAllUsersFromProject = getFunctions().httpsCallable('kickAllUsersFromProject');
        kickAllUsersFromProject({projectId: projectId}).then(result => {
            if (result.data.status === 'complete') {
                dispatch(unsubscribeFromDatabaseAsync());

                moveProjectToLocalLocationAsync(getState, getFirestore, projectId, project).then( () => {
                    dispatch(subscribeToDatabaseAsync());
                    dispatch(setIsShareMenuWaiting(false));
                    dispatch(setShareMenuMessage(""));
                }).catch(error => {
                    dispatch(postSnackbarMessage(error.message, false, 'error'));
                    dispatch(setIsShareMenuWaiting(false));
                    dispatch(setShareMenuMessage(""));
                })
            }

            if (result.data.status === 'error') {
                dispatch(postSnackbarMessage(result.data.message, false, 'error'));
                dispatch(setIsShareMenuWaiting(false));
                dispatch(setShareMenuMessage(""));
            }
        }).catch(error => {
            var message = `An Error occured, are you sure you are connected to the internet? Error Message : ${error.message}`;
            dispatch(postSnackbarMessage(message, false, 'infomation'));
            dispatch(setIsShareMenuWaiting(false));
            dispatch(setShareMenuMessage(""));
        })
    }
}

function moveProjectToLocalLocationAsync(getState, getFirestore, projectId, currentProject) {
    return new Promise((resolve, reject) => {
        // Transfer Project to Local Location.
        var remoteRef = getFirestore().collection(REMOTES).doc(projectId);
        var targetBatch = new FirestoreBatchPaginator(getFirestore());
        var sourceBatch = new FirestoreBatchPaginator(getFirestore());
        var requests = [];

        // Top Level Project Data.
        var project = ProjectFactory(
            currentProject.projectName,
            projectId,
            false,
            currentProject.created,
            currentProject.updated
        )

        // Project
        var topLevelUserRef = getFirestore().collection(USERS).doc(getUserUid()).collection(PROJECTS).doc(projectId);
        targetBatch.set(topLevelUserRef, project);
        
        var topLevelRemoteRef = getFirestore().collection(REMOTES).doc(projectId);
        sourceBatch.delete(topLevelRemoteRef);

        // Project Layout
        requests.push(remoteRef.collection(PROJECTLAYOUTS).doc(projectId).get().then(layoutDoc => {
            if (layoutDoc.exists) {
                var ref = getFirestore().collection(USERS).doc(getUserUid()).collection(PROJECTLAYOUTS).doc(layoutDoc.id);
                targetBatch.set(ref, layoutDoc.data());
                sourceBatch.delete(layoutDoc.ref);
            }
        }));

        // Task Lists.
        requests.push(remoteRef.collection(TASKLISTS).where('project', '==', projectId).get().then(taskListsSnapshot => {
            taskListsSnapshot.forEach(taskListDoc => {
                var ref = getFirestore().collection(USERS).doc(getUserUid()).collection(TASKLISTS).doc(taskListDoc.id);
                targetBatch.set(ref, taskListDoc.data());
                sourceBatch.delete(taskListDoc.ref);
            })
        }));

        // Tasks
        requests.push(new Promise((resolve, reject) => {
            remoteRef.collection(TASKS).where('project', '==', projectId).get().then(tasksSnapshot => {
                var taskCommentRequests = [];

                tasksSnapshot.forEach(taskDoc => {
                    var targetTaskRef = getFirestore().collection(USERS).doc(getUserUid()).collection(TASKS).doc(taskDoc.id);
                    targetBatch.set(targetTaskRef, taskDoc.data());
                    sourceBatch.delete(taskDoc.ref);

                    // Task may have Comments. Query for Comments and add to targetBatch.
                    if (taskDoc.data().mightHaveTaskComments === true) {
                        taskCommentRequests.push(taskDoc.ref.collection(TASKCOMMENTS).get().then(commentsSnapshot => {
                            commentsSnapshot.forEach(commentDoc => {
                                targetBatch.set(targetTaskRef.collection(TASKCOMMENTS).doc(commentDoc.id), commentDoc.data());
                            })
                        }))
                    }
                })

                // Don't resolve until all Requests to get Comments have been completed.
                Promise.all(taskCommentRequests).then(() => {
                    resolve();
                }).catch(error => {
                    reject(error);
                })
            })
        }))

        // Remote Id would have been taken care of by kickAllUsersFromProject Server function.

        Promise.all(requests).then(() => {
            targetBatch.commit().then(() => {
                sourceBatch.commit().then(() => {
                    resolve();
                }).catch(error => {
                    reject(error);
                })
            }).catch(error => {
                reject(error);
            })
        })
    })  
}

export function inviteUserToProjectAsync(projectName, targetEmail, sourceEmail, sourceDisplayName, projectId, role) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(setIsShareMenuWaiting(true));
        dispatch(setShareMenuMessage('Searching for User...'));

        var slowMessageTimer = setTimeout(() => {
            var message = "Hang tight!\nThe servers are waking up. Subsequent operations will complete faster."
            dispatch(setShareMenuSubMessage(message));
        }, 5000)

        var getRemoteUserData = getFunctions().httpsCallable('getRemoteUserData');
        getRemoteUserData({ targetEmail: targetEmail }).then(result => {
            if (result.data.status === 'user found') {
                // User Found.
                var userData = result.data.userData;

                var inviteData = {
                    projectName: projectName,
                    sourceEmail: sourceEmail,
                    sourceDisplayName: sourceDisplayName,
                    targetDisplayName: userData.displayName,
                    targetEmail: userData.email,
                    projectId: projectId,
                    targetUserId: userData.userId,
                    sourceUserId: getUserUid(),
                    role: role,
                }

                // If the project isn't Remote already it needs to be Moved. Promise will resolve Imediately if no migration
                // is required, otherwise it will resolve when migration is complete.
                maybeMigrateProjectAsync(dispatch, getFirestore, getState, projectId).then(() => {
                    dispatch(setShareMenuMessage('Sending invite.'));

                    var sendProjectInvite = getFunctions().httpsCallable('sendProjectInvite');
                    sendProjectInvite(inviteData).then(result => {
                        if (result.data.status === 'complete') {
                            dispatch(postSnackbarMessage("Invite sent.", true, 'affirmative-notification'));
                            dispatch(setIsShareMenuWaiting(false));
                            dispatch(setShareMenuMessage(""));
                            dispatch(setShareMenuSubMessage(""));
                            dispatch(selectProject(projectId));
                            clearTimeout(slowMessageTimer);
                        }

                        else {
                            dispatch(postSnackbarMessage(result.data.error, false, 'error'));
                            dispatch(setIsShareMenuWaiting(false));
                            dispatch(setShareMenuMessage(""));
                            dispatch(setShareMenuSubMessage(""));
                            clearTimeout(slowMessageTimer);
                        }
                    })
                })
            }

            else {
                // User not Found.
                dispatch(postSnackbarMessage('User not Found.', true, 'negative-notification'));
                dispatch(setIsShareMenuWaiting(false));
                dispatch(setShareMenuMessage(""));
                dispatch(setShareMenuSubMessage(""));
                clearTimeout(slowMessageTimer);
            }
        }).catch(error => {
            dispatch(setIsShareMenuWaiting(false));
            dispatch(setShareMenuMessage(''));
            var message = `An Error occured, are you sure you are connected to the internet? Error Message : ${error.message}`;
            dispatch(postSnackbarMessage(message, false, 'infomation'));
            dispatch(setShareMenuMessage(""));
            dispatch(setShareMenuSubMessage(""));
            clearTimeout(slowMessageTimer);
        })

    }
}

export function updateMemberRoleAsync(userId, projectId, newRole) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        addUpdatingUserId(dispatch, getState, userId, projectId);

        var memberRef = getFirestore().collection(REMOTES).doc(projectId).collection(MEMBERS).doc(userId);
        memberRef.update({ role: newRole }).then( () => {
            removeUpdatingUserId(dispatch, getState, userId, projectId);
        }).catch(error => {
            handleFirebaseUpdateError(error, getState(), dispatch);
            removeUpdatingUserId(dispatch, getState, userId, projectId);
        })
    }
}



export function kickUserFromProjectAsync(projectId, userId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        addUpdatingUserId(dispatch, getState, userId, projectId);

        var kickUserFromProject = getFunctions().httpsCallable('kickUserFromProject');
        kickUserFromProject({userId: userId, projectId: projectId}).then( result => {
            removeUpdatingUserId(dispatch, getState, userId, projectId);
        }).catch(error => {
            var message = "Something went wrong when kicking a user: " + error.message;
            dispatch(postSnackbarMessage(message, false, 'error'));
            removeUpdatingUserId(dispatch, getState, userId, projectId);
        })
    }
}

function maybeMigrateProjectAsync(dispatch, getFirestore, getState, projectId) {
    // Maybe migrate the project first if requried. Saves you copying the code into two branches of an if else.
    // If project is already remote, promise will resolve imediately and allow further execution to continue, otherwise it will
    // hold.. This is maybe a good candidate for await/async.
    return new Promise((resolve, reject) => {
        if (!isProjectRemote(getState, projectId)) {
            // Migrate project to 'remotes' collection.
            // Extract the project before you unsubscribe from the Database.
            var project = extractProject(getState, projectId);

            dispatch(setShowCompletedTasksAsync(false));
            dispatch(selectProject(-1));
            dispatch(clearData()); // Stops RGL seeing duplicate Task Lists.
            dispatch(setShareMenuMessage('Migrating Project...'));
            dispatch(unsubscribeFromDatabaseAsync(projectId));

            moveProjectToRemoteLocationAsync(getFirestore, getState, projectId, project).then(() => {
                dispatch(subscribeToDatabaseAsync())
                dispatch(selectProject(projectId));
                resolve();
            }).catch(error => {
                dispatch(postSnackbarMessage(error.message, false, 'error'));
                
                reject();
            })
        }

        else {
            resolve();
        }
    })
}


function moveProjectToRemoteLocationAsync(getFirestore, getState, projectId, currentProject)  {
    return new Promise((resolve, reject) => {
        // Transfer Project.
        var userRef = getFirestore().collection(USERS).doc(getUserUid());
        var targetBatch = new FirestoreBatchPaginator(getFirestore());
        var sourceBatch = new FirestoreBatchPaginator(getFirestore());
        var requests = [];

        var topLevelData = ProjectFactory(
            currentProject.projectName,
            projectId,
            true,
            currentProject.created,
            currentProject.updated
        )

        var topLevelRef = getFirestore().collection(REMOTES).doc(projectId);
        targetBatch.set(topLevelRef, topLevelData);
        sourceBatch.delete(getFirestore().collection(USERS).doc(getUserUid()).collection(PROJECTS).doc(projectId));

        // Members.
        var newMember = new MemberStore(getUserUid(), projectId, getState().displayName, getState().userEmail, 'added', 'owner');
        var memberRef = getFirestore().collection(REMOTES).doc(projectId).collection(MEMBERS).doc(newMember.userId);
        targetBatch.set(memberRef, Object.assign({}, newMember));

        // Project Layout
        requests.push(userRef.collection(PROJECTLAYOUTS).doc(projectId).get().then(layoutDoc => {
            if (layoutDoc.exists) {
                var ref = getFirestore().collection(REMOTES).doc(projectId).collection(PROJECTLAYOUTS).doc(layoutDoc.id);
                targetBatch.set(ref, layoutDoc.data());
                sourceBatch.delete(layoutDoc.ref);
            }
        }));

        // Task Lists.
        requests.push(userRef.collection(TASKLISTS).where('project', '==', projectId).get().then(taskListsSnapshot => {
            taskListsSnapshot.forEach(taskListDoc => {
                var ref = getFirestore().collection(REMOTES).doc(projectId).collection(TASKLISTS).doc(taskListDoc.id);
                targetBatch.set(ref, taskListDoc.data());
                sourceBatch.delete(taskListDoc.ref);
            })
        }));

        // Tasks.
        // Query and Collect Tasks, if Task has Comments, Query and collect them as well.
        requests.push(new Promise((resolve, reject) => {
            userRef.collection(TASKS).where('project', '==', projectId).get().then(tasksSnapshot => {
                var taskCommentRequests = [];

                tasksSnapshot.forEach(taskDoc => {
                    var targetTaskRef = getFirestore().collection(REMOTES).doc(projectId).collection(TASKS).doc(taskDoc.id);
                    targetBatch.set(targetTaskRef, taskDoc.data());
                    sourceBatch.delete(taskDoc.ref);

                    // Task may have Comments. Query for Comments and add to targetBatch.
                    if (taskDoc.data().mightHaveTaskComments === true) {
                        taskCommentRequests.push(taskDoc.ref.collection(TASKCOMMENTS).get().then(commentsSnapshot => {
                            commentsSnapshot.forEach(commentDoc => {
                                targetBatch.set(targetTaskRef.collection(TASKCOMMENTS).doc(commentDoc.id), commentDoc.data());
                            })
                        }))
                    }
                })

                // Don't resolve until all Requests to get Comments have been completed.
                Promise.all(taskCommentRequests).then(() => {
                    resolve();
                }).catch(error => {
                    reject(error);
                })
            })
        }))

        // Place RemoteId.
        var remoteIdRef = getFirestore().collection(USERS).doc(getUserUid()).collection(REMOTE_IDS).doc(projectId);
        sourceBatch.set(remoteIdRef, {projectId: projectId});

        Promise.all(requests).then(() => {
            targetBatch.commit().then(() => {
                sourceBatch.commit().then( () => {
                    resolve();
                }).catch(error => {
                    reject('Error while removing local references: ' + error.message);
                })
            }).catch(error => {
                reject('Error while moving Local Project: ' + error.message);
            })
        })
    })
}

export function attachAuthListenerAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        getAuth().onAuthStateChanged(user => {
            if (user) {

                if (newUser !== null) {
                    // A new user has just registered.
                    clearFirstTimeBootFlag(dispatch, getState);

                    // Send them to the Welcome Page if on Desktop.
                    if (HANDBALL_DEVICE === 'desktop') {
                        dispatch(setIsAppSettingsOpen(true));
                        dispatch(setAppSettingsMenuPage('welcome'));
                    }
                    

                    //  Make a directory listing for them.
                    var ref = getFirestore().collection(DIRECTORY).doc(newUser.email);
                    ref.set(Object.assign({}, new DirectoryStore(newUser.email, newUser.displayName, user.uid))).then(() => {
                        // Complete.
                        newUser = null;
                    }).catch(error => {
                        var message = `Critical error while setting directory listing, please contact the developer. Error : ${error.code}
                         ${error.message}`;
                        dispatch(postSnackbarMessage(message, false, 'error'));
                    });
                }

                if (getState().generalConfig.isFirstTimeBoot) {
                    clearFirstTimeBootFlag(dispatch, getState);
                }
                
                // User is Logged in.
                setUserUid(user.uid);
                dispatch(subscribeToDatabaseAsync());
                dispatch(setIsLoggedInFlag(true));
                dispatch(setUserEmail(user.email));
                dispatch(setDisplayName(user.displayName));
                dispatch(setAuthStatusMessage("Logged in"));
            }

            else {
                // User is logged out.
                // This Code may be called when App is booting up. If getUserUid is an empty string, then the App is booting
                // and no action is required.
                if (getUserUid() !== "") {
                    dispatch(setAuthStatusMessage("Logged out"));
                    //dispatch(unsubscribeFromDatabaseAsync());
                    dispatch(setIsLoggedInFlag(false));
                    dispatch(setUserEmail(""));
                    dispatch(setDisplayName(""));
                    dispatch(selectProject(-1));
                    dispatch(clearData());

                    setUserUid(""); // Clear UserUid Last as actions above may require it to build valid Database References.
                }
            }
        })
    }
}

export function subscribeToDatabaseAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        // Get Projects (Also attaches a Value listener for future changes).
        dispatch(getProjectsAsync());

        // Local Project Layouts.
        dispatch(getLocalProjectLayoutsAsync());

        // Remote Projects (Also attaches a Value listener for future changes).
        dispatch(getRemoteProjectIdsAsync());

        // Get Task Lists (Also Attaches a value listener for future changes).
        dispatch(getTaskListsAsync());

        // Get Tasks (Also attaches a Value listener for future changes).
        dispatch(getIncompletedLocalTasksAsync());
        if (getState().showCompletedTasks) { dispatch(getCompletedLocalTasksAsync()); } 
        
        // Get Account Config (Also attaches a Value listener for future changes).
        dispatch(getAccountConfigAsync());

        // Project Invites (Also attaches a Value listener for future changes).
        dispatch(getInvitesAsync());
    }
}

export function getInvitesAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        invitesUnsubscribe = getFirestore().collection(USERS).doc(getUserUid()).collection(INVITES).onSnapshot(snapshot => {
            if (snapshot.docChanges().length > 0) {
                var invites = [];
                snapshot.forEach(doc => {
                    invites.push(doc.data());
                })

                dispatch(receiveInvites(invites));
            }
        })
    }
}

export function unsubscribeFromDatabaseAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(unsubscribeProjectsAsync());

        getState().remoteProjectIds.forEach(id => {
            dispatch(unsubscribeFromRemoteProjectAsync(id));
        })

        dispatch(unsubscribeRemoteIds());
        dispatch(unsubscribeTaskListsAsync());
        dispatch(unsubscribeTasksAsync());
        dispatch(unsubscribeProjectLayoutsAsync());
        dispatch(unsubscribeAccountConfigAsync());
        dispatch(unsubscribeInvitesAsync());
    }
}

export function unsubscribeRemoteIds() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        if (remoteProjectIdsUnsubscribe !== null) {
            remoteProjectIdsUnsubscribe();
        }
    }
}

export function logOutUserAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(unsubscribeFromDatabaseAsync());

        getAuth().signOut().then(() => {

        }).catch(error => {
            let message = handleAuthError(error);
            dispatch(postSnackbarMessage(message, false, 'error'));

        })
    }
}

export function logInUserAsync(email,password) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(setIsLoggingInFlag(true));
        dispatch(setAuthStatusMessage("Logging in"));

        var parsedEmail = email.toLowerCase().trim();

        // Set Persistence.
        getAuth().setPersistence('local').then(() => {
            getAuth().signInWithEmailAndPassword(parsedEmail, password).catch(error => {
                handleAuthError(dispatch, error);
                dispatch(setIsLoggingInFlag(false));
                dispatch(setAuthStatusMessage("Logged out"));
            })
        }).catch(error => {
            handleAuthError(dispatch, error);
            dispatch(setIsLoggingInFlag(false));
            dispatch(setAuthStatusMessage("Logged Out"));
        })


    }
}

export function setFavouriteProjectIdAsync(projectId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        var ref = getFirestore().collection(USERS).doc(getUserUid()).collection(ACCOUNT).doc(ACCOUNT_DOC_ID);

        ref.set({
            favouriteProjectId: projectId
        }).then( () => {
            // Carefull what you do here, promises don't resolve if you are offline.
        }).catch(error => {
            handleFirebaseUpdateError(error, getState(), dispatch);
        })
    }
}


export function getGeneralConfigAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        getDexie().generalConfig.where('id').equals(0).first().then(data => {
            if (data !== undefined) {
                var config = data.value;
                dispatch(receiveGeneralConfig(config));

                if (getState().isStartingUp) {
                    // Application is Starting up. Dispatch Actions to Sync appliction to Config State.
                    syncAppToConfig(config, dispatch);
                }
            }
            // If data doesn't exist in Dexie we can safely assume that the Fallback values given to the initial state
            // are still correct.
            if (getState().isStartingUp) {
                syncAppToConfig(getState().generalConfig, dispatch);
            }
        })
    }
}

export function getCSSConfigAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        getDexie().cssConfig.where('id').equals(0).first().then(data => {
            if (data !== undefined) {
                // User has modified values.
                // Combine current State with values returned from Dexie.
                var configFromDB = data.value;
                var existingConfig = getState().cssConfig;
                var newConfig = {...existingConfig};
                for (var propertyName in configFromDB) {
                    newConfig[propertyName] = configFromDB[propertyName];
                }
                
                dispatch(receiveCSSConfig(newConfig));
            }

            // Nothing returned from Dexie. This means the user hasn't modified any values so we can rely on the
            // default values provided to the initial state.
        })
    }
}

export function setAllColorsToDefaultAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {

        // Update Dexie.
        getDexie().cssConfig.put({ id: 0, value: CssConfigStore }).then(() => {
        })

        // Update State.
        dispatch(receiveCSSConfig(CssConfigStore));
    }
}

export function setCSSConfigAsync(newConfig) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {

        // Update Dexie.
        getDexie().cssConfig.put({ id: 0, value: newConfig }).then(() => {
        })

        // Update State.
        dispatch(receiveCSSConfig(newConfig));
    }
}

export function setGeneralConfigAsync(newConfig) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        getDexie().generalConfig.put({ id: 0, value: newConfig }).then(() => {
            
        })

        // Update State.
        dispatch(receiveGeneralConfig(newConfig));
    }
}

export function purgeCompleteTasksAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(setDatabasePurgingFlag(true));

        getFirestore().collection(USERS).doc(getUserUid()).collection(TASKS).get().then(snapshot => {
            // Collect Id's of completed Tasks.
            var completedTaskIds = [];
            snapshot.forEach(doc => {
                if (doc.data().isComplete) {
                    completedTaskIds.push(doc.id);
                }
            })

            // Delete those Tasks.
            // Build Batch.
            var batch = new FirestoreBatchPaginator(getFirestore());
            completedTaskIds.forEach(taskId => {
                batch.delete(getFirestore().collection(TASKS).doc(taskId));
            })

            // Execute Batch.
            batch.commit().then(() => {
                dispatch(setDatabasePurgingFlag(false));
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })
        })
    }
}


export function getDatabaseInfoAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(setDatabaseInfo("...Collecting Info"));

        var projectCount = getState().projects.length;
        var taskListCount = getState().taskLists.length;
        var tasksCount = getState().tasks.length;
        var completedTasksCount = getState().tasks.filter(item => {
            return item.isComplete === true;
        }).length;

        // Collect Precursor data for calculating Orphans.
        var projectIds = getState().projects.map(item => {
            return item.uid;
        })

        var taskListIds = getState().taskLists.map(item => {
            return item.uid;
        })

        // Calculate Orphans
        // Tasks Orphaned from Project.
        var taskOrphansCount = getState().tasks.filter(item => {
            return !projectIds.includes(item.project);
        }).length;

        // TaskLists Orphaned from Project.
        var taskListOrphansCount = getState().taskLists.filter(item => {
            return !projectIds.includes(item.project);
        })

        // Tasks Orphaned from TaskLists.
        var taskTaskListOrphansCount = getState().tasks.filter(item => {
            return !taskListIds.includes(item.taskList);
        })

        // Build Info String.
        var infoString = "********** DATABASE INFO **********\n" +
            "                   ITEM COUNTS\n" +
            "-> Projects:  " + projectCount + "\n" +
            "-> Task Lists:    " + taskListCount + "\n" +
            "-> Tasks (Total):    " + tasksCount + "\n" +
            "-> Tasks (Completed):    " + completedTasksCount + "\n\n" +
            "                   ORPHAN ITEM COUNTS\n" +
            "Orphan Items are created from Database Sync issues, usually from a bad internet connection." + "\n" +
            "-> Tasks orphaned from Project:   " + taskOrphansCount + "\n" +
            "-> Tasks orphaned from Task Lists:    " + taskTaskListOrphansCount + "\n" +
            "-> Task Lists orphaned from Project:  " + taskListOrphansCount + "\n\n" +
            "\n \n " +
            "********** END OF INFO **********";

        dispatch(setDatabaseInfo(infoString));
    }
}

export function updateTaskPriorityAsync(taskId, newValue, oldValue) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(setOpenTaskInspectorId(-1));

        if (newValue !== oldValue) {
            // Determine Reference.
            var taskRef = getTaskRef(getFirestore, getState, taskId);

            // Update Firestore.
            taskRef.update({
                isHighPriority: newValue,
                metadata: getUpdatedMetadata(extractCurrentMetadata(getState(), taskId), { updatedBy: getState().displayName, updatedOn: getHumanFriendlyDate() })
            }).then(() => {
                // Careful what you do here, promises don't resolve if you are offline.
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })

            // Project updated metadata.
            updateProjectUpdatedTime(getState, getFirestore, getState().selectedProjectId);
        }
    }
}

export function updateTaskDueDateAsync(taskId, newDate, oldDate) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(setOpenTaskInspectorId(-1));

        if (newDate !== oldDate) {
            // Update Firestore.
            var taskRef = getTaskRef(getFirestore, getState, taskId);
            taskRef.update({
                dueDate: newDate,
                isNewTask: false,
                metadata: getUpdatedMetadata(extractCurrentMetadata(getState(), taskId), { updatedBy: getState().displayName, updatedOn: getHumanFriendlyDate() })
            }).then(() => {
                // Carefull what you do here, promises don't resolve if you are offline.
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })

            // Project updated metadata.
            updateProjectUpdatedTime(getState, getFirestore, getState().selectedProjectId);
        }
    }
}

export function updateTaskListSettingsAsync(taskListWidgetId, newValue) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        // Update Firestore.
        var taskListRef = getTaskListRef(getFirestore, getState, taskListWidgetId);

        taskListRef.update({
            settings: Object.assign({}, newValue)
        }).then(() => {
            /// Carefull what you do here, promises don't resolve if you are offline.
        }).catch(error => {
            handleFirebaseUpdateError(error, getState(), dispatch);
        })
    }
}


export function removeTaskListAsync(taskListWidgetId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        if (taskListWidgetId !== -1) {
            // Update Firestore.
            var selectedProjectId = getState().selectedProjectId;
            var isCurrentProjectRemote = isProjectRemote(getState, selectedProjectId);

            // Collect related TaskIds.
            var taskIds = collectTaskListRelatedTaskIds(getState().tasks, taskListWidgetId);

            // Build Batch.
            var batch = new FirestoreBatchPaginator(getFirestore());

            if (isRemovingLastTaskList(getState, selectedProjectId)) {
                // We are about to remove the last Task list. Queue up a request to delete any remaining Project Layouts.
                var projectLayoutRef = getProjectLayoutRef(getFirestore, getState, selectedProjectId);
                batch.update(projectLayoutRef.doc(selectedProjectId), {layouts: [] });
            }

            // Task list
            var taskListRef = getTaskListRef(getFirestore, getState, taskListWidgetId);
            batch.delete(taskListRef);

            // Tasks.
            if (isCurrentProjectRemote) {
                var selectedProjectId = selectedProjectId;
                taskIds.forEach(id => {
                    batch.delete(getFirestore().collection(REMOTES).doc(selectedProjectId).collection(TASKS).doc(id));
                })
            }

            else {
                taskIds.forEach(id => {
                    batch.delete(getFirestore().collection(USERS).doc(getUserUid()).collection(TASKS).doc(id));
                })
            }
            

            batch.commit().then(() => {
                // Carefull what you do here. Promises don't resolve if you are Offline.
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })

            dispatch(changeFocusedTaskList(-1));

            // Project updated metadata.
            updateProjectUpdatedTime(getState, getFirestore, selectedProjectId);
        }

    }
}


export function updateProjectNameAsync(projectId, newValue, oldValue) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(setOpenProjectSelectorId(-1));
        dispatch(setFloatingTextInput(false));

        var coercedValue = newValue === "" ? "Untitled Project" : newValue;
        if (coercedValue !== oldValue) {

            // Update Firestore.
            var projectRef = getProjectRef(getFirestore, getState, projectId);
            projectRef.update({ projectName: coercedValue }).then(() => {
                // Carefull what you do here, promises don't resolve if you are offline.
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })

            // Project updated metadata.
            updateProjectUpdatedTime(getState, getFirestore, getState().selectedProjectId);
        }
    }
}

export function removeProjectAsync(projectId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(setShowOnlySelfTasks(false));

        if (getState.selectedProjectId !== -1) {
            dispatch(setShowCompletedTasksAsync(false));
            dispatch(selectProject(-1));
            // Get a List of Task List Id's . It's Okay to collect these from State as associated taskLists have already
            // been loaded in via the handleProjectSelectorClick method. No point in querying Firebase again for this data.
            var taskListIds = getState().taskLists.filter(item => {
                return item.project === projectId;
            }).map(taskList => { return taskList.uid });

            var taskIds = collectProjectRelatedTaskIds(getState().tasks, projectId);

            // Build Updates.
            var batch = new FirestoreBatchPaginator(getFirestore());

            // Local
            // TaskLists.
            taskListIds.forEach(id => {
                batch.delete(getFirestore().collection(USERS).doc(getUserUid()).collection(TASKLISTS).doc(id));
            })

            // Tasks
            taskIds.forEach(id => {
                batch.delete(getFirestore().collection(USERS).doc(getUserUid()).collection(TASKS).doc(id));
            })
            
            // Project Layout
            var projectLayoutId = projectId;
            if (projectLayoutId !== -1) {
                batch.delete(getProjectLayoutRef(getFirestore, getState, projectLayoutId).doc(projectLayoutId));
            }

            // Project.
            batch.delete(getFirestore().collection(USERS).doc(getUserUid()).collection(PROJECTS).doc(projectId));

            // Execute the Batch.
            batch.commit().then(() => {
                // Carefull what you do here, promises don't resolve if you are offline.
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })
        }
    }
}

export function removeRemoteProjectAsync(projectId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        if (projectId !== -1 && isProjectRemote(getState, projectId)) {
            dispatch(setIsShareMenuWaiting(true));
            dispatch(setShareMenuMessage("Deleting Project"));
            dispatch(setShowCompletedTasksAsync(false));
            dispatch(selectProject(-1));

            var removeRemoteProject = getFunctions().httpsCallable('removeRemoteProject');
            removeRemoteProject({projectId: projectId}).then(result => {
                if (result.data.status === 'complete') {
                    dispatch(setIsShareMenuOpen(false));
                    dispatch(setIsShareMenuWaiting(false));
                    dispatch(setShareMenuMessage(""));
                }

                if (result.data.status === 'error') {
                    dispatch(postSnackbarMessage(result.data.message, false, 'error'));
                    dispatch(setIsShareMenuWaiting(false));
                    dispatch(setShareMenuMessage(""));
                }
            }).catch(error => {
                var message = `An Error occured, are you sure you are connected to the internet? Error Message : ${error.message}`; 
                dispatch(postSnackbarMessage(message, true, 'infomation'));
                dispatch(setIsShareMenuWaiting(false));
                dispatch(setShareMenuMessage(""));
            }) 
        }

        else {
            var message = "No project selected or project is not a shared project."
            dispatch(postSnackbarMessage(message, true, 'infomation'));
        }
    }
}

export function addNewProjectAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(setShowOnlySelfTasks(false));

        if (getState().isLoggedIn === true) {
            // Update Firestore.    
            var newProjectName = "";
            var batch = getFirestore().batch();

            // Project.
            var newProjectRef = getFirestore().collection(USERS).doc(getUserUid()).collection(PROJECTS).doc();
            var newProjectKey = newProjectRef.id;

            var newProject = new ProjectStore(newProjectName, newProjectKey, false, new Date().toISOString(), "");
            batch.set(newProjectRef, Object.assign({}, newProject));

            // Layout
            var newLayoutRef = getFirestore().collection(USERS).doc(getUserUid()).collection(PROJECTLAYOUTS).doc(newProjectKey);

            var newProjectLayout = new ProjectLayoutStore([], newProjectKey, newProjectKey);
            batch.set(newLayoutRef, Object.assign({}, newProjectLayout));

            // Selections.
            dispatch(selectProject(newProjectKey));
            dispatch(setOpenProjectSelectorId(newProjectKey));


            // Execute Additions.
            batch.commit().then(() => {
                // Carefull what you do here, promises don't resolve if you are offline.
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })
        }

    }
}

export function addNewProjectWithNameAsync(projectName) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(setShowOnlySelfTasks(false));
        dispatch(setFloatingTextInput(false));

        if (getState().isLoggedIn === true) {
            // Update Firestore.    
            var newProjectName = projectName === "" ? "Untitled Project" : projectName;
            var batch = getFirestore().batch();

            // Project.
            var newProjectRef = getFirestore().collection(USERS).doc(getUserUid()).collection(PROJECTS).doc();
            var newProjectKey = newProjectRef.id;

            var newProject = new ProjectStore(newProjectName, newProjectKey, false, new Date().toISOString(), "");
            batch.set(newProjectRef, Object.assign({}, newProject));

            // Layout
            var newLayoutRef = getFirestore().collection(USERS).doc(getUserUid()).collection(PROJECTLAYOUTS).doc(newProjectKey);

            var newProjectLayout = new ProjectLayoutStore([], newProjectKey, newProjectKey);
            batch.set(newLayoutRef, Object.assign({}, newProjectLayout));

            // Selections.
            dispatch(selectProject(newProjectKey));

            // Execute Additions.
            batch.commit().then(() => {
                // Carefull what you do here, promises don't resolve if you are offline.
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })
        }

    }
}

export function updateTaskCompleteAsync(taskListWidgetId, taskId, newValue, oldValue, currentMetadata) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        if (oldValue !== newValue) {
            if (getState().selectedTask.taskListWidgetId !== taskListWidgetId &&
                getState().selectedTask.taskId !== taskId) {
                dispatch(selectTask(taskListWidgetId, taskId, false));
            }

            // Update Firestore.
            var taskRef = getTaskRef(getFirestore, getState, taskId);
            var completedBy = newValue === true ? getState().displayName : "";
            var completedOn = newValue === true ? getHumanFriendlyDate() : "";

            taskRef.update({
                isComplete: newValue,
                isNewTask: false,
                metadata: getUpdatedMetadata(currentMetadata, {
                    completedBy: completedBy,
                    completedOn: completedOn,
                })
            }).then(() => {
                // Carefull what you do here, promises don't resolve if you are offline.h.
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })

            // Project updated metadata.
            updateProjectUpdatedTime(getState, getFirestore, getState().selectedProjectId);
        }
    }
}

export function updateProjectLayoutAsync(layouts, oldLayouts, projectId, taskListIdsToFoul) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        var newTrimmedLayouts = sanitizeLayouts(layouts);
        var oldTrimmedLayouts = sanitizeLayouts(oldLayouts);

        if (compareProjectLayouts(oldTrimmedLayouts, newTrimmedLayouts) !== true) {
            // Update Firestore.
            var batch = getFirestore().batch();

            var targetProjectLayoutId = getProjectLayoutType(projectId, getState().members, getUserUid()) === 'global' ? projectId : getUserUid();

            var projectLayoutRef = getProjectLayoutRef(getFirestore, getState, projectId).doc(targetProjectLayoutId);
            batch.update(projectLayoutRef, { layouts: newTrimmedLayouts });

            // // taskListIdsToFoul - Task Lists that don't yet have a corresponding Project Layout entity are considered
            // // 'fresh', they have a property 'isFresh' that tracks that. By virtue of the fact that we are updating a
            // // projects layout, we can also update any fresh Task Lists isFresh property. ie: fouling them.
            // if (taskListIdsToFoul !== undefined && taskListIdsToFoul !== null) {
            //     taskListIdsToFoul.forEach(id => {
            //         var ref = getTaskListRef(getFirestore, getState, id);

            //         batch.update(ref, { isFresh: false });
            //     })
            // }

            batch.commit().then(() => {
                // Carefull what you do here, promises don't resolve if you are offline.
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            });
        }
    }
}


export function updateTaskNameAsync(taskListWidgetId, taskId, newValue, oldValue, currentMetadata) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(closeTask(taskListWidgetId, taskId));
        dispatch(setFloatingTextInput(false));

            // Because we Reset the new task property. (Which supports pushing new Tasks to the top of the List).
            // We can't perform an equality check. We have to naievly update.

            var update = {
                taskName: newValue,
                isNewTask: false, // Reset new Task Property.
                metadata: getUpdatedMetadata(currentMetadata, { updatedBy: getState().displayName, updatedOn: getHumanFriendlyDate() })
            }

            // Returns a new Update Object with arguments parsed in (if any);
            var newUpdate = parseArgumentsIntoUpdate(getState, update);

            // Update Firestore.
            var taskRef = getTaskRef(getFirestore, getState, taskId);
            taskRef.update(newUpdate).then(() => {
                // Carefull what you do here, promises don't resolve if you are offline.
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })

            // Project updated metadata.
            updateProjectUpdatedTime(getState, getFirestore, getState().selectedProjectId);
    }
}

export function removeSelectedTaskAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {

        var taskId = getState().selectedTask.taskId;
        if (taskId !== -1) {
            deleteTaskAsync(getFirestore, getState, taskId).then(() => {
                // Careful what you do here. Promises don't resolve Offline.
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })
            dispatch(selectTask(getState().focusedTaskListId, -1, false));

            // Project updated metadata.
            updateProjectUpdatedTime(getState, getFirestore, getState().selectedProjectId);
        }
    }
}

export function removeTaskAsync(taskId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        if (taskId !== -1) {
            deleteTaskAsync(getFirestore, getState, taskId).then(() => {
                // Careful what you do here. Promises don't resolve Offline.
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })
            dispatch(selectTask(getState().focusedTaskListId, -1, false));

            // Project updated metadata.
            updateProjectUpdatedTime(getState, getFirestore, getState().selectedProjectId);
        }
    }
}


function deleteTaskAsync(getFirestore, getState, taskId) {
    return new Promise((resolve, reject) => {
        // Update Firestore.    
        // Build Batch and Execute.
        var batch = getFirestore().batch();
        var taskRef = getTaskRef(getFirestore, getState, taskId);
        batch.delete(taskRef);

        batch.commit().then(() => {
            resolve();
        }).catch(error => {
            reject(error);
        });

        // Project updated metadata.
        updateProjectUpdatedTime(getState, getFirestore, getState().selectedProjectId);
    })
}

export function updateTaskListWidgetHeaderAsync(taskListWidgetId, newName, oldName) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(setOpenTaskListWidgetHeaderId(-1));
        dispatch(setFloatingTextInput(false));

        if (newName !== oldName) {
            var taskListRef = getTaskListRef(getFirestore, getState, taskListWidgetId);

            taskListRef.update({ taskListName: newName }).then(() => {
                // Carefull what you do here, promises don't resolve if you are offline.
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })

            // Project updated metadata.
            updateProjectUpdatedTime(getState, getFirestore, getState().selectedProjectId);
        }
    }
}


export function moveTaskAsync(destinationTaskListId, taskId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(startTaskMoveInDatabase());

        // If Task was moved via Drag and Drop, taskId will have been passed in as parameter.
        var movingTaskId = taskId === undefined ? getState().movingTaskId : taskId;
        var taskRef = getTaskRef(getFirestore, getState, movingTaskId);

        // Can't get currentMetadata from the Task directly, so extract it here.
        var currentMetadata = getState().tasks.find(task => {return task.uid === movingTaskId}).metadata;

        taskRef.update({
            taskList: destinationTaskListId,
            metadata: getUpdatedMetadata(currentMetadata, {updatedBy: getState().displayName, updatedOn: getHumanFriendlyDate()}),
        }).then(() => {
            /// Carefull what you do here, promises don't resolve if you are offline.
        }).catch(error => {
            handleFirebaseUpdateError(error, getState(), dispatch);
        })

        dispatch(endTaskMove(movingTaskId, destinationTaskListId));
        dispatch(changeFocusedTaskList(destinationTaskListId));

        // Project updated metadata.
        updateProjectUpdatedTime(getState, getFirestore, getState().selectedProjectId);
    }
}


export function addNewTaskAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(setShowOnlySelfTasks(false));

        if (getState().focusedTaskListId !== -1) {

            const { selectedProjectId, focusedTaskListId } = getState();

            if (selectedProjectId !== -1 && focusedTaskListId !== -1) {
                // Add a new Task.
                dispatch(startTaskAdd());

                var newTaskRef;
                if (isProjectRemote(getState, getState().selectedProjectId)) {
                    newTaskRef = getFirestore().collection(REMOTES).doc(getState().selectedProjectId).collection(TASKS).doc();
                }

                else {
                    newTaskRef = getFirestore().collection(USERS).doc(getUserUid()).collection(TASKS).doc();
                }
                
                var metadata = new TaskMetadataStore(getState().displayName, getHumanFriendlyDate(new Date()), "", "", "","");

                var newTaskKey = newTaskRef.id;
                var newTask = new TaskStore(
                    "",
                    "",
                    false,
                    selectedProjectId,
                    focusedTaskListId,
                    newTaskKey,
                    new Moment().toISOString(),
                    true,
                    false,
                    Object.assign({},metadata),
                    -1,
                )

                newTaskRef.set(Object.assign({}, newTask)).then(() => {
                }).catch(error => {
                    handleFirebaseUpdateError(error, getState(), dispatch);
                })

                dispatch(openTask(newTask.taskList, newTask.uid)); // Opening a Task by convention Selects it.

                // Project updated metadata.
                updateProjectUpdatedTime(getState, getFirestore, getState().selectedProjectId);

            }
        }
    }
}

export function addNewTaskWithNameAsync(taskName) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(setShowOnlySelfTasks(false));

        const { selectedProjectId, focusedTaskListId } = getState();

        if (selectedProjectId !== -1 && focusedTaskListId !== -1) {
            // Add a new Task.
            dispatch(startTaskAdd());
            dispatch(setFloatingTextInput(false));
            dispatch(closeTask(focusedTaskListId, newTaskKey)); // Close the Task Input for brevity. Even though
            // technically we don't use this in Mobile.

            var newTaskRef;
            if (isProjectRemote(getState, getState().selectedProjectId)) {
                newTaskRef = getFirestore().collection(REMOTES).doc(getState().selectedProjectId).collection(TASKS).doc();
            }

            else {
                newTaskRef = getFirestore().collection(USERS).doc(getUserUid()).collection(TASKS).doc();
            }

            var metadata = new TaskMetadataStore(getState().displayName, getHumanFriendlyDate(new Date()), "", "", "","");

            
            // Parse Arguments into an Update Object.
            var parsedUpdate = parseArgumentsIntoUpdate(getState, { 
                taskName: taskName,
                dueDate: "",
                isHighPriority: false
            });

            var parsedTaskName = parsedUpdate.taskName;
            var parsedDueDate = parsedUpdate.dueDate;
            var parsedPriority = parsedUpdate.isHighPriority;


            var newTaskKey = newTaskRef.id;
            var newTask = new TaskStore(
                parsedTaskName,
                parsedDueDate,
                false,
                selectedProjectId,
                focusedTaskListId,
                newTaskKey,
                new Moment().toISOString(),
                false,
                parsedPriority,
                Object.assign({}, metadata),
                -1,
            )

            newTaskRef.set(Object.assign({}, newTask)).then(() => {
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })

            dispatch(selectTask(focusedTaskListId, newTaskKey, false));

            // Project updated metadata.
            updateProjectUpdatedTime(getState, getFirestore, getState().selectedProjectId);

        }
    }
}

export function addNewTaskListAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(setShowOnlySelfTasks(false));
        dispatch(startTasklistAdd());

        var selectedProjectId = getState().selectedProjectId;

        if (selectedProjectId !== -1) {
            // Add to Firestore.
            var batch = getFirestore().batch();

            var newTaskListRef;

            if (isProjectRemote(getState, selectedProjectId)) {
                newTaskListRef = getFirestore().collection(REMOTES).doc(selectedProjectId).collection(TASKLISTS).doc();
            }
            
            else {
                newTaskListRef = getFirestore().collection(USERS).doc(getUserUid()).collection(TASKLISTS).doc();
            }

            var newTaskList = new TaskListStore(
                "",
                selectedProjectId,
                newTaskListRef.id,
                newTaskListRef.id,
                Object.assign({}, new TaskListSettingsStore(true, "date added", ChecklistSettingsFactory(false,"", "", 1))),
                true,
            )

            batch.set(newTaskListRef, { ...newTaskList });

            dispatch(changeFocusedTaskList(newTaskListRef.id));
            dispatch(setOpenTaskListWidgetHeaderId(newTaskListRef.id));
            
            // Add a new Entry into the ProjectLayouts for this Task List.
            addProjectLayoutEntriesToBatch(batch, selectedProjectId, newTaskListRef.id, getFirestore, getState);

            batch.commit().then( () => {
                // Success
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })

            // Project updated metadata.
            updateProjectUpdatedTime(getState, getFirestore, getState().selectedProjectId);
        }
    }
}


export function addNewTaskListWithNameAsync(taskListName) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(setShowOnlySelfTasks(false));
        dispatch(startTasklistAdd());
        dispatch(setFloatingTextInput(false));

        var selectedProjectId = getState().selectedProjectId;

        if (selectedProjectId !== -1) {
            // Add to Firestore.
            var batch = getFirestore().batch();

            var newTaskListRef;

            if (isProjectRemote(getState, selectedProjectId)) {
                newTaskListRef = getFirestore().collection(REMOTES).doc(selectedProjectId).collection(TASKLISTS).doc();
            }
            
            else {
                newTaskListRef = getFirestore().collection(USERS).doc(getUserUid()).collection(TASKLISTS).doc();
            }

            var newTaskList = new TaskListStore(
                taskListName,
                selectedProjectId,
                newTaskListRef.id,
                newTaskListRef.id,
                Object.assign({}, new TaskListSettingsStore(true, "date added", ChecklistSettingsFactory(false,"", "", 1))),
                true,
            )

            batch.set(newTaskListRef, { ...newTaskList });

            // Add a new Entry into the ProjectLayouts for this Task List.
            addProjectLayoutEntriesToBatch(batch, selectedProjectId, newTaskListRef.id, getFirestore, getState);

            batch.commit().then(() => {
                // Careful what you do here, promises don't resolve if you are offline.
            }).catch(error => {
                handleFirebaseUpdateError(error, getState(), dispatch);
            })

            dispatch(changeFocusedTaskList(newTaskListRef.id));

            // Project updated metadata.
            updateProjectUpdatedTime(getState, getFirestore, getState().selectedProjectId);
        }
    }
}

export function getAccountConfigAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        accountConfigUnsubscribe = getFirestore().collection(USERS).doc(getUserUid()).collection(ACCOUNT).doc(ACCOUNT_DOC_ID).onSnapshot( doc => {
            if (doc.exists) {
                var accountConfig = doc.data();
                dispatch(receiveAccountConfig(accountConfig));

                // Dexie returns numbers as strings. Convert "-1" to a number if required.
                var favouriteProjectId = accountConfig.favouriteProjectId === "-1" ?
                    parseInt(accountConfig.favouriteProjectId) :
                    accountConfig.favouriteProjectId;

                dispatch(selectProject(favouriteProjectId));
                
                if (HANDBALL_DEVICE === "mobile" && favouriteProjectId !== -1) {
                    dispatch(setIsSidebarOpen(false));
                    dispatch(setIsAppSettingsOpen(false));
                }
            }
        }, error => {
            handleFirebaseSnapshotError(error, getState(), dispatch);
        })
    }
}

export function getProjectsAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(startProjectsFetch());

        // Get Projects from Firestore.
        localProjectsUnsubscribe = getFirestore().collection(USERS).doc(getUserUid()).collection(PROJECTS).onSnapshot(includeMetadataChanges, snapshot => {
            // Handle metadata.
            dispatch(setProjectsHavePendingWrites(snapshot.metadata.hasPendingWrites));

            if (snapshot.docChanges().length > 0) {
                var projects = [];
                snapshot.forEach(doc => {
                    projects.push(doc.data());
                })

                dispatch(receiveLocalProjects(projects));
            }
        }, error => {
            handleFirebaseSnapshotError(error, getState(), dispatch);
        })
    }
}

export function getIncompletedLocalTasksAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(startTasksFetch());

        // Get Tasks from Firestore.
        var tasksRef = getFirestore().collection(USERS).doc(getUserUid()).collection(TASKS);

        // Get only completed Tasks.
        onlyIncompletedLocalTasksUnsubscribe = tasksRef.where('isComplete', '==', false).orderBy("project").onSnapshot(includeMetadataChanges, snapshot => {
            handleTasksSnapshot(getState, dispatch, false, snapshot, undefined, 'incompletedOnly');
        }, error => {
            handleFirebaseSnapshotError(error, getState(), dispatch);
        })
    }
}

export function getCompletedLocalTasksAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(startTasksFetch());

        // Get Tasks from Firestore.
        var tasksRef = getFirestore().collection(USERS).doc(getUserUid()).collection(TASKS);

        // Get only completed Tasks.
        onlyCompletedLocalTasksUnsubscribe = tasksRef.where('isComplete', '==', true).orderBy("project").onSnapshot(includeMetadataChanges, snapshot => {
            handleTasksSnapshot(getState, dispatch, false, snapshot, undefined, 'completedOnly');
        }, error => {
            handleFirebaseSnapshotError(error, getState(), dispatch);
        })
    }
}

function handleTasksSnapshot(getState, dispatch, isRemote, snapshot, remoteProjectId, type) {
    // Handle Metadata.
    if (snapshot.metadata !== undefined) {
        dispatch(setTasksHavePendingWrites(snapshot.metadata.hasPendingWrites))
    }

    // Handle Tasks.
    if (snapshot.docChanges().length > 0) {
        var tasks = [];
        snapshot.forEach(doc => {
            tasks.push(doc.data());
        });

        // Remote
        if (isRemote) {
            if (type === 'completedOnly') {
                dispatch(receiveCompletedRemoteTasks(mergeRemoteTasks(getState().completedRemoteTasks, tasks, remoteProjectId)));
            }

            if (type === 'incompletedOnly') {
                dispatch(receiveIncompletedRemoteTasks(mergeRemoteTasks(getState().incompletedRemoteTasks, tasks, remoteProjectId)));
            }
        }

        // Local
        else {
            if (type === 'completedOnly') {
                dispatch(receiveCompletedLocalTasks(tasks));
            }

            if (type === 'incompletedOnly') {
                dispatch(receiveIncompletedLocalTasks(tasks));
            }
        }
    }
}

function mergeRemoteTasks(mergeTarget, newTasks, remoteProjectId) {
    var filteredTasks = mergeTarget.filter(item => {
        return item.project !== remoteProjectId;
    })

    return [...filteredTasks, ...newTasks];
}

export function getTaskListsAsync(projectId) {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(startTaskListsFetch());

        // Get Tasklists from Firestore.
        localTaskListsUnsubscribe = getFirestore().collection(USERS).doc(getUserUid()).collection(TASKLISTS).onSnapshot(includeMetadataChanges, snapshot => {
    
            handleTaskListsSnapshot(getState, dispatch, false, snapshot, projectId)
        }, error => {
            handleFirebaseSnapshotError(error, getState(), dispatch);
        });
    }
}

function handleTaskListsSnapshot(getState, dispatch, isRemote, snapshot, remoteProjectId) {
    // Handle Metadata.
    if (snapshot.metadata !== undefined ) {
        dispatch(setTaskListsHavePendingWrites(snapshot.metadata.hasPendingWrites));
    }

    if (snapshot.docChanges().length > 0) {
        var taskLists = [];
        var checklists = [];
        snapshot.forEach(doc => {
            var taskList = coerceTaskList(doc.data());
            taskLists.push(taskList);

            // Keep track of checklists.
            if (taskList.settings.checklistSettings.isChecklist) { checklists.push(taskList) };
        })

        if (isRemote) {
            var filteredTaskLists = getState().remoteTaskLists.filter(item => {
                return item.project !== remoteProjectId;
            })

            taskLists = [...taskLists, ...filteredTaskLists];
            dispatch(receiveRemoteTaskLists(taskLists));

            // Renew any checklists requring renewel.
            processChecklists(dispatch, checklists, true, remoteProjectId);
            
        }

        else {
            dispatch(receiveLocalTaskLists(taskLists));

            // Renew any checklists requring renewel.
            processChecklists(dispatch, checklists, false, null);
        }
        
    }
}

function processChecklists(dispatch, checklists, isRemote, remoteProjectId) {
    checklists.forEach(item => {
        if (isChecklistDueForRenew(item.settings.checklistSettings)) {
            dispatch(renewChecklistAsync(item, isRemote, remoteProjectId, false));
        }
    })
}

function coerceTaskList(taskList) {
    var workingTaskList = {...taskList};

    if (taskList.settings.checklistSettings === undefined) {
        workingTaskList.settings.checklistSettings = ChecklistSettingsFactory(false,"", "", 1);
    }

    return workingTaskList;
}

export function getLocalProjectLayoutsAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        dispatch(startProjectLayoutsFetch());

        var projectLayoutsRef = getFirestore().collection(USERS).doc(getUserUid()).collection(PROJECTLAYOUTS);
        localProjectLayoutsUnsubscribe = projectLayoutsRef.onSnapshot(includeMetadataChanges, snapshot => {
            handleProjectLayoutsSnapshot(getState, dispatch, false, snapshot)
        }, error => {
            handleFirebaseSnapshotError(error, getState(), dispatch);
        });
    }
}

function handleProjectLayoutsSnapshot(getState, dispatch, isRemote, snapshot, remoteProjectId) {
    // Handle Metadata.
    dispatch(setProjectLayoutsHavePendingWrites(snapshot.metadata.hasPendingWrites));

    if (snapshot.docChanges().length > 0) {
        var projectLayouts = [];
        if (snapshot.empty !== true) {
            snapshot.forEach(doc => {
                projectLayouts.push(doc.data());
            })
        }

        if (isRemote) {
            var filteredProjectLayouts = getState().remoteProjectLayouts.filter(item => {
                return item.project !== remoteProjectId;
            })

            projectLayouts = [...projectLayouts, ...filteredProjectLayouts];   
            dispatch(receiveRemoteProjectLayouts(projectLayouts));         
        }

        else {
            dispatch(receiveLocalProjectLayouts(projectLayouts));
        }
    }
}

export function unsubscribeAccountConfigAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        if (accountConfigUnsubscribe !== null) {
            accountConfigUnsubscribe();
        }
    }
}

export function unsubscribeProjectsAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        if (localProjectsUnsubscribe !== null) {
            localProjectsUnsubscribe();
        }
    }
}

export function unsubscribeTaskListsAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        if (localTaskListsUnsubscribe !== null) {
            localTaskListsUnsubscribe();
        }
    }
}

export function unsubscribeTasksAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        if (onlyCompletedLocalTasksUnsubscribe !== null) {
            onlyCompletedLocalTasksUnsubscribe();
        }

        if (onlyIncompletedLocalTasksUnsubscribe !== null) {
            onlyIncompletedLocalTasksUnsubscribe();
        }
    }
}

export function unsubscribeInvitesAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        if (invitesUnsubscribe !== null) {
            invitesUnsubscribe();
        }
    }
}

export function unsubscribeProjectLayoutsAsync() {
    return (dispatch, getState, { getFirestore, getAuth, getDexie, getFunctions }) => {
        if (localProjectLayoutsUnsubscribe !== null) {
            localProjectLayoutsUnsubscribe();
        }
    }
}

// Helper Functions.
function isRemovingLastTaskList(getState, projectId) {
    var filteredTaskLists = []
    filteredTaskLists = getState().taskLists.filter(item => {
        return item.project === projectId;
    })

    return filteredTaskLists.length === 1;
}

function compareProjectLayouts(layoutsA, layoutsB) {
    var layoutsAJSON = JSON.stringify(layoutsA);
    var layoutsBJSON = JSON.stringify(layoutsB);

    return layoutsAJSON === layoutsBJSON;
}


function extractProject(getState, projectId) {
    return getState().projects.find(item => {
        return item.uid === projectId;
    })
}

function updateProjectUpdatedTime(getState, getFirestore, projectId) {
    var ref = getProjectRef(getFirestore, getState, projectId);

    ref.update({updated: new Date().toISOString()}).then( () => {
        // Careful what you do here, promises don't resolve Offline.
    }).catch(error => {
        handleFirebaseUpdateError(error, getState(), dispatch);
    })
}


function addUpdatingInviteId(dispatch, getState, inviteId) {
    var oldUpdatingInviteIds = getState().updatingInviteIds;


    if (oldUpdatingInviteIds.includes(inviteId) === false) {
        var newUpdatingInviteIds = [...oldUpdatingInviteIds];
        newUpdatingInviteIds.push(inviteId);
        dispatch(setUpdatingInviteIds(newUpdatingInviteIds));
    }
    
}

function removeUpdatingInviteId(dispatch, getState, inviteId) {
    var oldUpdatingInviteIds = getState().updatingInviteIds;
    var newUpdatingInviteIds = [];

    var index = oldUpdatingInviteIds.findIndex(id => {
        return id === inviteId;
    })

    if (index !== -1) {
        newUpdatingInviteIds = [...oldUpdatingInviteIds];
        newUpdatingInviteIds.splice(index, 1);
        dispatch(setUpdatingInviteIds(newUpdatingInviteIds));
    }
}

function addUpdatingUserId(dispatch, getState, userId, projectId) {
    var oldUpdatingUserIds = getState().updatingUserIds;
    var newUpdatingUserIds = [];
    var alreadyExists = oldUpdatingUserIds.some(item => {
        return item.projectId === projectId && item.userId === userId;
    })

    if (!alreadyExists) {
        newUpdatingUserIds = [...oldUpdatingUserIds];
        newUpdatingUserIds.push({projectId: projectId, userId: userId});
        dispatch(setUpdatingUserIds(newUpdatingUserIds));
    }
    
}

function removeUpdatingUserId(dispatch, getState, userId, projectId) {
    var oldUpdatingUserIds = getState().updatingUserIds;
    var newUpdatingUserIds = [];

    var index = oldUpdatingUserIds.findIndex(item => {
        return item.projectId === projectId && item.userId === userId;
    })

    if (index !== -1) {
        newUpdatingUserIds = [...oldUpdatingUserIds];
        newUpdatingUserIds.splice(index, 1);

        dispatch(setUpdatingUserIds(newUpdatingUserIds));
    }
}

// Determine if an update to the Metadata should occur. Updates should be ignored for a set ammount of time after a Task is
// created to stop CreatedAt and UpdatedAt times being the same or very similiar.
function shouldUpdateMetadata(currentMetadata) {
    if (currentMetadata.createdOn === undefined ||
         currentMetadata.createdOn === null ||
          currentMetadata.createdOn === "") {
        return true;
    }

    // Determine Difference.
    var createdOn = Moment(currentMetadata.createdOn, DATE_FORMAT);
    var now = Moment();

    return now.diff(createdOn, 'seconds') > 120
}


function getUpdatedMetadata(currentMetadata, update) {
    // Coerce currentMetadata to a Valid object.
    if (currentMetadata === undefined) {
        currentMetadata = Object.assign({}, new TaskMetadataStore("","","","","",""));
    }
    if (currentMetadata['completedOn'] === undefined) {currentMetadata['completedOn'] = ""}

    if (shouldUpdateMetadata(currentMetadata)) {
        // Merge update into currentMetadata.
        for (var propertyName in update) {
            currentMetadata[propertyName] = update[propertyName];
        }
    }
    
    return currentMetadata;
    
}

function getHumanFriendlyDate(jsDate) {
    if (jsDate === undefined) {
        jsDate = new Date();
    }
    var date = Moment(jsDate).format(DATE_FORMAT);

    return date;
}

function getProjectRef(getFirestore, getState, projectId) {
    if (isProjectRemote(getState, projectId)) {
        return getFirestore().collection(REMOTES).doc(projectId);
    }

    else {
        return getFirestore().collection(USERS).doc(getUserUid()).collection(PROJECTS).doc(projectId);
    }
}

function getProjectLayoutRef(getFirestore, getState, projectId) {
    if (isProjectRemote(getState, projectId)) {
        return getFirestore().collection(REMOTES).doc(projectId).collection(PROJECTLAYOUTS);
    }

    else {
        return getFirestore().collection(USERS).doc(getUserUid()).collection(PROJECTLAYOUTS);
    }
}

function getTaskRef(getFirestore, getState, taskId) {
    var selectedProjectId = getState().selectedProjectId;

    if (isProjectRemote(getState, selectedProjectId)) {
        return getFirestore().collection(REMOTES).doc(selectedProjectId).collection(TASKS).doc(taskId);
    }

    else {
        return getFirestore().collection(USERS).doc(getUserUid()).collection(TASKS).doc(taskId);
    }
}

function getTaskListRef(getFirestore, getState, taskListId) {
    var selectedProjectId = getState().selectedProjectId;
    if (isProjectRemote(getState, selectedProjectId)) {
        return getFirestore().collection(REMOTES).doc(selectedProjectId).collection(TASKLISTS).doc(taskListId);
    }

    else {
        return getFirestore().collection(USERS).doc(getUserUid()).collection(TASKLISTS).doc(taskListId);
    }
}

function isProjectRemote(getState, projectId) {
    var index = getState().remoteProjectIds.findIndex(id => { return id === projectId });
    return index !== -1;
}

function handleFirebaseSnapshotError(error, state, dispatch) {
    switch (error.code) {
        case "permission-denied":
            if (state.isLoggedIn) {
                dispatch(postSnackbarMessage(error.message, false, 'error'))
            }
            
            // No handling required if logged out. Expected behaviour.
            break;
        default:
            throw error;
    }
}

function handleFirebaseUpdateError(error, state, dispatch) {
    switch (error.code) {
        case "permission-denied":
            if (state.isLoggedIn) {
                dispatch(postSnackbarMessage(`${error.code} : ${error.message}`, false, 'error'));
            }

            else {
                let message = "You must log in first.";
                dispatch(postSnackbarMessage(message, true, 'infomation'));
            }

        default:
            throw error;
    }
    
}


function handleAuthError(dispatch, error) {
    switch (error.code) {
        case "auth/wrong-password":
            dispatch(postSnackbarMessage("Incorrect password", true, 'negative-notification'))
            break;

        case "auth/no-user-found":
            dispatch(postSnackbarMessage("No user matching that email was found", true, 'negative-notification'));
            break;

        case "auth/invalid-email":
            dispatch(postSnackbarMessage("The email you have entered is invalid", true, 'negative-notification'));
            break;

        case "auth/network-request-failed":
            dispatch(postSnackbarMessage("Cannot reach the authentication servers, are you sure you have an internet connection?", true, 'negative-notification'));
            break;

        case "auth/email-already-in-use":
            dispatch(postSnackbarMessage("A user with that email is already registered", true, 'negative-notification'));
            break;

        case "auth/weak-password":
            dispatch(postSnackbarMessage("Password to weak, must be longer than 6 characters", true, 'negative-notification'));
            break;
        
        case "auth/user-disabled":
            dispatch(postSnackbarMessage("Sorry, your account has been disabled by the developer.", true, 'negative-notification'));
            break;
        
        default:
            dispatch(postSnackbarMessage(`${error.code} : ${error.message}`, false, 'error'));
    }
}

function extractCurrentMetadata(state, taskId) {
    var tasks = state.tasks;
    
    var targetTask = tasks.find(item => {
        return item.uid === taskId;
    })

    return targetTask === undefined ? undefined : targetTask.metadata;
}

function parseArgumentsIntoUpdate(getState, update) {
    // Search for Arguments in taskName.
    var taskName = update.taskName;
    var argumentStartIndex = getArgumentsStartIndex(taskName);

    if (argumentStartIndex === -1) {
        // No Arguments Found. Bail out.
        return update;
    }

    // Split Arguments from from Normal Task Name.
    var taskSubstring = taskName.substring(0, argumentStartIndex);
    var argumentsSubstring = taskName.substring(argumentStartIndex);

    // Coerce Values.
    taskSubstring = taskSubstring === undefined ? "" : taskSubstring;
    argumentsSubstring = argumentsSubstring === undefined ? "" : argumentsSubstring;

    // Convert string into args array.
    var args = stringArgv(argumentsSubstring);

    // Parse arguments.
    var argv = parseArgs(args);

    // Merge arguments with provided update.
    var parsedUpdate = { ...update };

    // dueDate.
    if (argv.d !== undefined) {
        parsedUpdate.dueDate = parseDateArgument(argv.d);
    }

    // isHighPriority
    if (argv.p !== undefined) {
        parsedUpdate.isHighPriority = true;
    }

    if (argv.i !== undefined) {
        parsedUpdate.isHighPriority = true;
    }

    // Note.
    if (argv.n !== undefined) {
        parsedUpdate.note = argv.n;
    }

    // Assign Task to.
    if (argv.a !== undefined) {
        if (argv.a === true) {
            // Clear AssignedTo.
            parsedUpdate.assignedTo = -1;
        }

        else if (argv.a !== null && argv.a.trim() !== "") {
            // Fuzzy search for a userId.
            var userId = fuzzyMatchUserId(getState, argv.a);
            if (userId !== undefined && userId !== -1) {
                // Match found.
                parsedUpdate.assignedTo = userId;
            }
        }
    }

    // Set taskName to everything except the arguments.
    parsedUpdate.taskName = taskSubstring;

    // Override with Lorem Ipsum Text if in Dev.
    if (process.env.NODE_ENV === 'development') {
        if (argv.l !== undefined) {
            if (argv.l === true) {
                parsedUpdate.taskName = loremIpsum({ count: 1, random: Math.random });
            }

            else {
                parsedUpdate.taskName = loremIpsum({ count: argv.l, random: Math.random });
            }
        }
    }
    return parsedUpdate;
}

function getArgumentsStartIndex(taskName) {
    var regex = / -[a-zA-Z]/ // Search for Whitepace THEN Hypen THEN Any Alphanumeric Character.
    var match = regex.exec(taskName);

    if (match) {
        return match.index;
    }

    else {
        return -1;
    }
}

function fuzzyMatchUserId(getState, entry) {
    // Fuzzy search through members for a match.
    var selectedProjectId = getState().selectedProjectId;    
    var filteredMembers = getState().members.filter(item => {
        return item.project === selectedProjectId;
    })

    // Add some entries for user typing 'me' or 'myself'.. and irene.
    filteredMembers.push({ displayName: 'me', userId: getUserUid() });
    filteredMembers.push({ displayName: 'myself', userId: getUserUid() });

    var options = {
        shouldSort: true,
        includeScore: true,
        threshold: 0.6,
        location: 0,
        distance: 100,
        maxPatternLength: 16,
        minMatchCharLength: 1,
        keys: [
          "displayName"
      ]
      };

      var fuse = new Fuse(filteredMembers, options);
      var result = fuse.search(entry);

      if (result.length === 0) {
          // No Result Found.
          return -1;
      }

      else {
          return result[0].item.userId;
      }
}

function parseDateArgument(d) {
    // Clear Due Date.
    if (d === true) {
        // Clear due Date.
        return "";
    }

    // Number without 'd' suffix.
    if (typeof d === "number") {
        // Assume user means Days.
        return getDaysForwardDate(d);
    }

    var value = d.toLowerCase();

    // Today.
    if (value === "today") {
        return getDaysForwardDate(0);
    }

    // Tomomrrow - Catch mispellings as well.
    if (value.includes('tom')) {
        return getDaysForwardDate(1);
    }

    // Is a day Name.
    if (isDayName(value)) {
        return getDayNameDate(value);
    }

    // Date
    if (value.includes('/')) {
        return getParsedDate(d);
    }

    // Days Forward.
    if (value.includes('d') || value.includes('day')) {
        return getDaysForwardDate(d.slice(0, d.length - 1));
    }

    // Weeks Forward.
    if (value.includes('w')) {
        return getWeeksForwardDate((d.slice(0, d.length - 1)));
    }

    return "";
}

function collectProjectRelatedTaskIds(tasks, projectId) {
    return tasks.filter(task => {
        return task.project === projectId
    }).map(task => { return task.uid });
}

function collectTaskListRelatedTaskIds(tasks, taskListWidgetId) {
    // Collect related TaskIds.
    var taskIds = tasks.filter(task => {
        return task.taskList === taskListWidgetId;
    }).map(task => { return task.uid });

    return taskIds;
}


function sanitizeLayouts(layouts) {
    // Layouts from RGL come with Functions and undefined values as properties which can't be serialized to Firestore.
    var trimmedLayouts = layouts.map(item => {
        return {
            i: item.i,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
        }
    })

    return trimmedLayouts
}

function syncAppToConfig(generalConfig, dispatch) {
    if (generalConfig.startLocked) {
        dispatch(lockApp());
    }

    dispatch(setIsStartingUpFlag(false));
}

function hasUserGotALocalLayout(state) {
    var selectedProjectId = state.selectedProjectId;
    return state.projectLayoutsMap[selectedProjectId][getUserUid()] !== undefined;
}

function addProjectLayoutEntriesToBatch(batch, selectedProjectId, taskListId, getFirestore, getState) {
    var newLayoutEntry = LayoutEntryFactory(taskListId);

    // Iterate through all layouts for this Project and add the entry to them.
    for (var uid in getState().projectLayoutsMap[selectedProjectId]) {
        var ref = getProjectLayoutRef(getFirestore, getState, selectedProjectId).doc(uid);

        var newLayouts = [ ...getState().projectLayoutsMap[selectedProjectId][uid].layouts ];
        newLayouts.push(newLayoutEntry);

        batch.update(ref, { layouts: newLayouts });
    }
}