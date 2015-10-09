/// <reference path="../../includes.d.ts" />
declare module Developer {
    function workspaceLink(): string;
    function createWorkspacesBreadcrumbs(developPerspective: any): {
        href: string;
        label: string;
        title: string;
    }[];
    function createWorkspacesSubNavBars(developPerspective: any): any;
    function createWorkspaceBreadcrumbs(children?: any, workspaceName?: any): any;
    function createEnvironmentBreadcrumbs($scope: any, $location: any, $routeParams: any): any;
    function createProjectBreadcrumbs(projectName?: any, children?: any, workspaceName?: any): any;
    function createWorkspaceSubNavBars(): any;
    function createProjectSubNavBars(projectName: any, jenkinsJobId?: any): any;
    function createJenkinsBreadcrumbs(projectName: any, jobId: any, buildId: any): any;
    function createJenkinsSubNavBars(projectName: any, jenkinsJobId: any, buildId: any, extraOption?: any): any;
    function createEnvironmentSubNavBars($scope: any, $location: any, $routeParams: any): any;
}