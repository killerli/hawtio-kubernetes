/// <reference path="../../includes.ts"/>
module Developer {

  export function enrichWorkspaces(projects) {
    angular.forEach(projects, (project) => {
      enrichWorkspace(project);
    });
    return projects;
  }

  export function enrichWorkspace(project) {
    if (project) {
      var name = Kubernetes.getName(project);
      project.$name = name;
      project.$sortOrder = 0 - project.number;

      var nameArray = name.split("-");
      var nameArrayLength = nameArray.length;
      project.$shortName = (nameArrayLength > 4) ? nameArray.slice(0, nameArrayLength - 4).join("-") : name.substring(0, 30);

      var labels = Kubernetes.getLabels(project);
      project.$creationDate = asDate(Kubernetes.getCreationTimestamp(project));
      project.$labelsText = Kubernetes.labelsToString(labels);

      var team = labels["team"] || labels["project"];
      // lets add a query so that the back button works
      var query = "?q=";
      if (name) {
        if (team) {
          project.$projectsLink = UrlHelpers.join("workspaces", team, "/namespace", name) + query;
          project.$runtimeLink = UrlHelpers.join("workspaces", team, "/namespace", name, "/apps") + query;
        } else {
          project.$projectsLink = UrlHelpers.join("workspaces", name) + query;
          project.$runtimeLink = UrlHelpers.join("kubernetes/namespace/", name, "/apps") + query;
        }
        project.$viewLink = project.$projectsLink;
      }
    }
    return project;
  }

  export function asDate(value) {
    return value ? new Date(value) : null;
  }

  export function enrichJenkinsJobs(jobsData, projectId, jobName) {
    if (jobsData) {
      angular.forEach(jobsData.jobs, (job) => {
        enrichJenkinsJob(job, projectId, jobName);
      });
    }
    return jobsData;
  }

  export function enrichJenkinsJob(job, projectId, jobName) {
    if (job) {
      jobName = jobName || job.name || projectId;
      job.$jobId = jobName;
      job.$project = projectId || jobName;
      var lastBuild = job.lastBuild;
      var lastBuildResult = lastBuild ? lastBuild.result : "NOT_STARTED";
      var $iconClass = HawtioPipelineView.createBuildStatusIconClass(lastBuildResult);

      job.$lastBuildNumber = enrichJenkinsBuild(job, lastBuild);
      job.$lastSuccessfulBuildNumber = enrichJenkinsBuild(job, job.lastSuccessfulBuild);
      job.$lastFailedlBuildNumber = enrichJenkinsBuild(job, job.lastFailedlBuild);

      if (lastBuild) {
        job.$duration = lastBuild.duration;
        job.$timestamp = asDate(lastBuild.timestamp);
      }
      var jobUrl = (job || {}).url;
      if (!jobUrl || !jobUrl.startsWith("http")) {
        var jenkinsUrl = jenkinsLink();
        if (jenkinsUrl) {
          jobUrl = UrlHelpers.join(jenkinsUrl, "job", jobName)
        }
      }
      if (jobUrl) {
        job.$jobLink = jobUrl;
        var workspaceName = Kubernetes.currentKubernetesNamespace();
        job.$pipelinesLink = UrlHelpers.join(HawtioCore.documentBase(), "/workspaces", workspaceName, "projects", job.$project, "jenkinsJob", jobName, "pipelines");
        job.$buildsLink = UrlHelpers.join(HawtioCore.documentBase(), "/workspaces", workspaceName, "projects", job.$project, "jenkinsJob", jobName);
      }
      job.$iconClass = $iconClass;

      angular.forEach(job.builds, (build) => {
        enrichJenkinsBuild(job, build);
      });
    }
    return job;
  }

  export function enrichJenkinsBuild(job, build, namespace?:string) {
    var number = null;
    if (build) {
      build.$duration = build.duration;
      build.$timestamp = asDate(build.timestamp);
      var projectId = job.$project;
      var jobName = job.$jobId || projectId;
      var buildId = build.id;
      number = build.number;
      var workspaceName = namespace || Kubernetes.currentKubernetesNamespace();

      var $iconClass = HawtioPipelineView.createBuildStatusIconClass(build.result);
      var jobUrl = (job || {}).url;
      if (!jobUrl || !jobUrl.startsWith("http")) {
        var jenkinsUrl = jenkinsLink();
        if (jenkinsUrl) {
          jobUrl = UrlHelpers.join(jenkinsUrl, "job", jobName)
        }
      }
      if (jobUrl) {
        build.$jobLink = jobUrl;
        if (buildId) {
          //build.$logsLink = UrlHelpers.join(build.$buildLink, "console");
          build.$logsLink = UrlHelpers.join(HawtioCore.documentBase(), "/workspaces", workspaceName, "projects", projectId, "jenkinsJob", jobName, "log", buildId);
          build.$pipelineLink = UrlHelpers.join(HawtioCore.documentBase(), "/workspaces", workspaceName, "projects", projectId, "jenkinsJob", jobName, "pipeline", buildId);
          build.$buildsLink = UrlHelpers.join(HawtioCore.documentBase(), "/workspaces", workspaceName, "projects", projectId, "jenkinsJob", jobName);
          //build.$buildLink = UrlHelpers.join(jobUrl, build.id);
          build.$buildLink = build.$logsLink;
        }
      }
      build.$iconClass = $iconClass;
    }
    return number;
  }


  export function jenkinsLink() {
    var ServiceRegistry = Kubernetes.inject<any>("ServiceRegistry");
    if (ServiceRegistry) {
      return ServiceRegistry.serviceLink(jenkinsServiceName);
    }
    return null;
  }

  export function forgeReadyLink() {
    var ServiceRegistry = Kubernetes.inject<any>("ServiceRegistry");
    if (ServiceRegistry) {
      return ServiceRegistry.serviceReadyLink(Kubernetes.fabric8ForgeServiceName);
    }
    return null;
  }

  export function enrichJenkinsPipelineJob(job, projectId, jobId) {
    if (job) {
      job.$project = projectId;
      job.$jobId = jobId;
      angular.forEach(job.builds, (build) => {
        enrichJenkinsStages(build, projectId, jobId);
      });
    }
  }

  export function enrichJenkinsStages(build, projectId, jobName) {
    if (build) {
      build.$project = projectId;
      build.$jobId = jobName;
      build.$timestamp = asDate(build.timeInMillis);
      build.$iconClass = HawtioPipelineView.createBuildStatusIconClass(build.result || "NOT_STARTED");

      var workspaceName = Kubernetes.currentKubernetesNamespace();
      var parameters = build.parameters;
      var $parameterCount = 0;
      var $parameterText = "No parameters";
      if (parameters) {
        $parameterCount = _.keys(parameters).length || 0;
        $parameterText = Kubernetes.labelsToString(parameters, " ");
      }
      build.$parameterCount = $parameterCount;
      build.$parameterText = $parameterText;
      var jenkinsUrl = jenkinsLink();
      if (jenkinsUrl) {
        var url = build.url;
        if (url) {
/*
          build.$viewLink = UrlHelpers.join(jenkinsUrl, url);
          build.$logLink = UrlHelpers.join(build.$viewLink, "log");
*/
        }
      }
      build.$logLink = UrlHelpers.join(HawtioCore.documentBase(), "/workspaces", workspaceName, "projects", projectId, "jenkinsJob", jobName, "log", build.id);
      build.$viewLink = build.$logLink;

      angular.forEach(build.stages, (stage) => {
        enrichJenkinsStage(stage, build);
      });
    }
    return build;
  }

  export function enrichJenkinsStage(stage, build = null) {
    if (stage) {
      if (build) {
        stage.$buildId = build.id;
        stage.$project = build.$project;
      }
      var projectId = build.$project;
      var jobName = build.$jobId || projectId;
      var buildId = build.id;
      var workspaceName = Kubernetes.currentKubernetesNamespace();
      stage.$backgroundClass =  HawtioPipelineView.createBuildStatusBackgroundClass(stage.status);
      stage.$iconClass = HawtioPipelineView.createBuildStatusIconClass(stage.status);
      stage.$startTime = asDate(stage.startTime);
      if (!stage.duration) {
        stage.duration = 0;
      }
      var jenkinsUrl = jenkinsLink();
      if (jenkinsUrl) {
        var url = stage.url;
        if (url) {
          stage.$viewLink = UrlHelpers.join(jenkinsUrl, url);
          stage.$logLink = UrlHelpers.join(stage.$viewLink, "log");
          if (projectId && buildId) {
            stage.$logLink = UrlHelpers.join(HawtioCore.documentBase(), "/workspaces", workspaceName, "projects", projectId, "jenkinsJob", jobName, "log", buildId);
          }
        }
      }
    }
  }
}
