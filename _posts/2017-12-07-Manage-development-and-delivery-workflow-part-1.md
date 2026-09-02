---
title:       "Delivery workflow with jGit-flow & Jenkins — Part 1"
part_title:  "Tools and planning"
description: >-
  The jgit-flow Maven plugin, Jira and Jenkins Pipeline as a single delivery workflow:
  what each tool owns, and how git-flow maps onto your real releases.
permalink:   /manage-development-and-delivery-workflow-with-jgit-flow-and-jenkins-pipeline-part-1/
date:        2018-09-11 14:05:45
series:      "Development & Delivery with jGit-flow and Jenkins"
part:        1
tags:        [jira, jenkins, pipeline, git-flow, jgit-flow, ci/cd, release, deployment, maven]
image:       /img/workflow-main.jpg
image_w:     1200
image_h:     800
---

As the team grows bigger, and the projects become more complex, proper development conventions, workflow and [CI/CD](https://en.wikipedia.org/wiki/CI/CD) process become very important.
In this series of posts I'll describe such flow and process, from the Jira ticket to the delivery (and deployment), using a popular stack, including Jira, Git, Maven, and Jenkins.

<br><br>
Let's start with a quick review of the tools we’ll use for the workflow implementation

<br><br>
## **Jira**

[Atlassian Jira](https://en.wikipedia.org/wiki/Jira_(software)) is a popular proprietary issue tracking system.

We'll manipulate Atlassian Jira feature tickets along the flow. This can be skipped if you don’t use Jira.

The project we'll manage would be part of the Server team (ST) and the feature that we like to implement and deploy would be ST-145.

Its initial ticket status is 'open', the resolution is ‘unresolved’:

![Jira ticket ST-145 in its initial state: status Open, resolution Unresolved]({{ '/img/inital_task.png' | relative_url }})


<br><br>
## **GitFlow**

[GitFlow](http://nvie.com/posts/a-successful-git-branching-model/) is a branching model for Git, created by Vincent Driessen.

The GitFlow workflow defines a strict branching model designed around the project release. It uses the following branches:

* Master: Stores the official release history. The origin/master is the main branch where the source code of HEAD always reflects a *production-ready* state.

* Develop: Serves as an integration branch for features

* Feature: Each new feature resides in its own branch. Feature branches use 'develop' as their parent branch. When a feature is complete, it gets merged back into ‘develop’

* Release: Supports preparation of a new production release.

* Hotfix: When a critical bug in a production version must be resolved immediately, a 'hotfix' branch may be branched off from the corresponding tag on the 'master' branch that marks the production version.

If you're new to git-flow, please take some time to read about it [in Driessen's post](http://nvie.com/posts/a-successful-git-branching-model/) or in [Atlassian's Guide](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow).

<br><br>
## **Jgit-flow (Maven plugin)**

[JGit-Flow](https://bitbucket.org/atlassian/jgit-flow) [maven plugin](https://mvnrepository.com/artifact/external.atlassian.jgitflow/jgitflow-maven-plugin) is a Java implementation of GitFlow, and like Jira, it was published by Atlassian. It designs for releasing a maven-based project and includes many other useful features.

'jGit-flow' provides the following git-flow basic functionality:

* [jgitflow:feature-start](https://web.archive.org/web/20210112062255/https://bitbucket.org/atlassian/jgit-flow/wiki/goals/feature-start) Starts a feature branch

* [jgitflow:feature-finish](https://web.archive.org/web/20190920065509/https://bitbucket.org/atlassian/jgit-flow/wiki/goals/feature-finish) Merges a feature branch

* [jgitflow:release-start](https://web.archive.org/web/20201201114936/https://bitbucket.org/atlassian/jgit-flow/wiki/goals/release-start) Starts a release

* [jgitflow:release-finish](https://web.archive.org/web/20201201124310/https://bitbucket.org/atlassian/jgit-flow/wiki/goals/release-finish) Merges a release

* [jgitflow:hotfix-start](https://web.archive.org/web/20210112062303/https://bitbucket.org/atlassian/jgit-flow/wiki/goals/hotfix-start) Starts a hotfix

* [jgitflow:hotfix-finish](https://web.archive.org/web/20210112062257/https://bitbucket.org/atlassian/jgit-flow/wiki/goals/hotfix-finish) Merges a hotfix

Each feature contains many attributes, providing very useful functionality (described in the links), that we'll use later on.

<br><br>
## **Jgit-flow-jira**

[JGit-Flow-Jira](https://github.com/FullGC/jgit-flow-jira) is a fork that I made for 'jgit-flow', which uses a Jira client to change the state of a Jira ticket during the lifecycle of a feature. Unfortunately, jgit-flow is not bug-free, and currently maintained mostly by the users and not by Atlassian. It is, however, published as open source and written very clearly. Jgitflow-jira contains a fix for this [open bug](https://ecosystem.atlassian.net/browse/MJF-109) as well.

<br><br>
## **Jenkins(Pipeline)**

[Jenkins Pipeline](https://jenkins.io/doc/book/pipeline/) (or simply "Pipeline") is a suite of plugins which supports implementing and integrating *continuous delivery pipelines* into Jenkins.
<img align="right" src="/img/pipelinememe.png" height="200" width="150" alt="Pipeline meme">

As opposed to the historic Gui-driven CI/CD tools for Jenkins jobs, the definition of a Pipeline is written into a text file (called a [Jenkinsfile](https://jenkins.io/doc/book/pipeline/jenkinsfile)) as a code. This in turn can be committed to a project's source control repository.

We will use Pipeline for build, tests and release.

The Pipeline script would be written in Groovy and would use Jenkins syntax and shell commands.

<br><br>
## **Complete development, release and deployment plan**

The flow-chart below describes the entire workflow, from the Jira ticket to deployment, that we'll learn how to implement in the following sections.

We'll review a development flow of a feature that was assigned to the 'server team' called 'ST-145’, and the process of releasing and deploying the next version: v 1.2.0, of an application called 'volcano’.

There are many shapes and arrows in the graph, but there's no need to make sense of them all right now, since we’re going to do exactly that in the following sections.![The complete development, release and deployment flow across Jira, jGit-flow and Jenkins]({{ '/public/l8Up2rOYZomboTh06PZE0A_img_1.png' | relative_url }})
