import { createStore, applyMiddleware } from 'redux';
import { appReducer } from './reducers/index';
import Logger from 'redux-logger';
import ReduxThunk from 'redux-thunk';
import { setupFirebase, getFirestore, getAuth, getFunctions, AccountConfigFallback } from '../pounder-firebase';
import { ProjectLayoutStore, CssConfigStore, MuiThemeFactory, ThemeFactory } from '../pounder-stores';
import { initializeDexie, getDexie, generalConfigFallback } from '../pounder-dexie';
import { DefaultTheme } from '../pounder-themes';

export var includeMetadataChanges = { includeMetadataChanges: false }

// Make sure you are calling this first before using the Store.
export function setupBackend(mode, platform) {
    // Firebase.
    setupFirebase(mode);
    
    if (platform === "desktop") {
        includeMetadataChanges = { includeMetadataChanges: true }
    }

    else {
        includeMetadataChanges = { includeMetadataChanges: false }
    }

    // Dexie.
    initializeDexie();
}

var initialState = {
    projects: [],
    members: [],
    memberLookup: {},
    invites: [],
    localProjects: [],
    remoteProjects: [],
    remoteProjectIds: [],
    taskLists: [],
    filteredTaskLists: [],
    localTaskLists: [],
    remoteTaskLists: [],
    tasks: [],
    filteredTasks: [],
    incompletedLocalTasks: [],
    completedLocalTasks: [],
    incompletedRemoteTasks: [],
    completedRemoteTasks: [],
    focusedTaskListId: -1,
    openTaskListWidgetHeaderId: -1,
    openProjectSelectorId: -1,
    selectedProjectLayout: {},
    projectLayoutsMap: {},
    localProjectLayouts: [],
    remoteProjectLayouts: [],
    selectedTask: { taskListWidgetId: -1, taskId: -1, isInputOpen: false },
    localMuiThemes: [],
    muiThemes: [ DefaultTheme ],
    selectedProjectId: -1,
    isSelectedProjectRemote: false,
    isATaskMoving: false,
    movingTaskId: -1,
    sourceTaskListId: -1,
    openTaskInfoId: -1,
    openTaskListSettingsMenuId: -1,
    isAwaitingFirebase: false,
    projectSelectorIndicators: [],
    isLockScreenDisplayed: false,
    lastBackupDate: "",
    openTaskListSettingsMenuId: -1,
    projectsHavePendingWrites: false,
    projectLayoutsHavePendingWrites: false,
    taskListsHavePendingWrites: false,
    tasksHavePendingWrites: false,
    isJumpMenuOpen: false,
    isShuttingDown: false,
    isStartingUp: true,
    appSettingsMenuPage: "general",
    databaseInfo: "",
    isDatabasePurging: false,
    isDatabaseRestoring: false,
    generalConfig: generalConfigFallback,
    isDexieConfigLoadComplete: false,
    isAppSettingsOpen: false,
    accountConfig: AccountConfigFallback,
    ignoreFullscreenTrigger: false,
    cssConfig: CssConfigStore, // Fallback values for CSS Config already exist within the CSS bundle.
    messageBox: {},
    authStatusMessage: "",
    isLoggingIn: false,
    isLoggedIn: false,
    userEmail: "",
    displayName: "",
    isUpdateSnackbarOpen: false,
    isAppDrawerOpen: true,
    openShareMenuId: -1,
    isShareMenuWaiting: false,
    shareMenuMessage: "",
    shareMenuSubMessage: "",
    updatingUserIds: [],
    updatingInviteIds: [],
    openTaskOptionsId: -1,
    showOnlySelfTasks: false,
    generalSnackbar: {
        isOpen: false,
        type: 'information',
        message: '',
        selfDismissTime: 0,
        actionOptions: {
            actionButtonText: 'Okay', onAction: () => {}
        }
    },
    undoSnackbar: {
        isOpen: false,
        text: '',
        onUndo: () => {}
    },
    textInputDialog: { isOpen: false, text: "", label: "", title: "", onCancel: () => {}, onOkay: () => {} },
    informationDialog: { isOpen: false, text: "", title: "", onOkay: () => {} },
    confirmationDialog: {
        isOpen: false,
        text: "",
        title: "",
        affirmativeButtonText: "Okay",
        negativeButtonText: "Cancel",
        onAffirmative: () => {},
        onNegative: () => {},
    },
    itemSelectDialog: {
        isOpen: false,
        title: "",
        text: "",
        items: [],
        affirmativeButtonText: "Okay",
        negativeButtonText: "Cancel",
        onAffirmative: () => {},
        onNegative: () => {},
    },
    quickItemSelectDialog: {
        isOpen: false,
        title: "",
        text: "",
        items: [],
        negativeButtonText: "",
        onSelect: () => {},
        onNegative: () => {},
    },
    isInRegisterMode: false,
    showCompletedTasks: false,
    isProjectMenuOpen: false,
    isGettingTaskComments: false,
    taskComments: [],
    pendingTaskCommentIds: [],
    isTaskCommentsPaginating: false,
    isAllTaskCommentsFetched: false,
    openTaskInspectorId: -1,
    openTaskInspectorEntity: null,
    selectedProjectLayoutType: 'global',
    openChecklistSettingsId: -1,
    openChecklistSettingsEntity: null,
    isASnackbarOpen: false,
    selectedMuiThemeId: 'default',
    enableStates: {
        newProject: false,
        newTaskFab: false,
        newTaskListFab: false,
        projectMenu: false,
    },
    isOnboarding: false,
    onboarderStep: 0,
    isInducting: false,
    lastUndoAction: null,
    canUndo: false,
}

export var appStore = createStore(
    appReducer,
    initialState,
applyMiddleware(ReduxThunk.withExtraArgument( { getFirestore, getAuth, getDexie, getFunctions } ), /* Logger */)
);

// Types.
export const MessageBoxTypes = {
    STANDARD: "STANDARD",
    OK_ONLY: "OK_ONLY",
}