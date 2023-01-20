---
title: "智能的命令"
date: 2023-01-20T22:23:53+08:00
---

> 智能的命令也不会遇到兔女郎学姐。

## 智能

智能的命令会给使用者带来更好的体验，比如不小心输入错参数时可以提示相似的正确参数、提供更易用的参数等等。举个例子：

``` bash
✿ git ad .
git：'ad' 不是一个 git 命令。参见 'git --help'。

最相似的命令是
        add
        am
```

## git

那么git是怎么做的呢？源码面前，了无秘密，直接一手clone:

~~~ bash
git clone https://github.com/git/git.git --depth=1
~~~

然后``cd``进去看， 找到``po/zh_CN.po``：

~~~ bash
cd git
cd po
nvim zh_CN.po
~~~

搜索``不是一个 git``，能找到上面报错的翻译，对应的源码在``help.c``，属于``help_unknown_cmd``函数。

~~~ bash
# po/zh_CN.po
    3 #: help.c
    2 #, c-format
    1 msgid "git: '%s' is not a git command. See 'git --help'."
20201 msgstr "git：'%s' 不是一个 git 命令。参见 'git --help'。"

# help.c
  597 const char *help_unknown_cmd(const char *cmd)
    1 {
  ...
   17
   18 	if (autocorrect == AUTOCORRECT_NEVER) {
   19 		fprintf_ln(stderr, _("git: '%s' is not a git command. See 'git --help'      ."), cmd);
   20 		exit(1);
   21 	}
~~~

用``grep``找找调用这个函数的地方，结果很不错，只有两处调用，其中一处还位于``buildin``文件夹里，八成不是，先忽略。查看另一处调用的位置。

~~~ bash
✿ grep -rn help_unknown_cmd
help.c:597:const char *help_unknown_cmd(const char *cmd)
git.c:909:                      cmd = argv[0] = help_unknown_cmd(cmd);
builtin/help.c:589:             return help_unknown_cmd(cmd);
help.h:33:const char *help_unknown_cmd(const char *cmd);

# git.c
    1 	if (!done_help) {
  909 		cmd = argv[0] = help_unknown_cmd(cmd);
    1 		done_help = 1;
    2 	} else
    3 		break;
~~~

好像不太对，直接找刚才的提示吧。

~~~ bash
✿ grep -rn -a5 "最相似"
po/zh_CN.po-20231-msgid_plural ""
po/zh_CN.po-20232-"\n"
po/zh_CN.po-20233-"The most similar commands are"
po/zh_CN.po-20234-msgstr[0] ""
po/zh_CN.po-20235-"\n"
po/zh_CN.po:20236:"最相似的命令是"
po/zh_CN.po-20237-msgstr[1] ""
po/zh_CN.po-20238-"\n"
po/zh_CN.po:20239:"最相似的命令是"
po/zh_CN.po-20240-
po/zh_CN.po-20241-#: help.c
po/zh_CN.po-20242-msgid "git version [--build-options]"
po/zh_CN.po-20243-msgstr "git version [--build-options]"
po/zh_CN.po-20244-

✿ grep -rn 'The most similar commands ar' *.c
help.c:718:                           "\nThe most similar commands are",
~~~

还是``help.c``里，打开看：

~~~ c
    /* This abuses cmdname->len for levenshtein distance */
    for (i = 0, n = 0; i < main_cmds.cnt; i++) {
            int cmp = 0; /* avoid compiler stupidity */
            const char *candidate = main_cmds.names[i]->name;

            /*
                * An exact match means we have the command, but
                * for some reason exec'ing it gave us ENOENT; probably
                * it's a bad interpreter in the #! line.
                */
            if (!strcmp(candidate, cmd))
                    die(_(bad_interpreter_advice), cmd, cmd);

            /* Does the candidate appear in common_cmds list? */
            while (common_cmds[n].name &&
                    (cmp = strcmp(common_cmds[n].name, candidate)) < 0)
                    n++;
            if (common_cmds[n].name && !cmp) {
                    /* Yes, this is one of the common commands */
                    n++; /* use the entry from common_cmds[] */
                    if (starts_with(candidate, cmd)) {
                            /* Give prefix match a very good score */
                            main_cmds.names[i]->len = 0;
                            continue;
                    }
            }

            main_cmds.names[i]->len =
                    levenshtein(cmd, candidate, 0, 2, 1, 3) + 1;
    }
    FREE_AND_NULL(common_cmds);

    QSORT(main_cmds.names, main_cmds.cnt, levenshtein_compare);
    if (!main_cmds.cnt)
        die(_("Uh oh. Your system reports no Git commands at all."));

    /* skip and count prefix matches */
    for (n = 0; n < main_cmds.cnt && !main_cmds.names[n]->len; n++)
            ; /* still counting */

    if (main_cmds.cnt <= n) {
            /* prefix matches with everything? that is too ambiguous */
            best_similarity = SIMILARITY_FLOOR + 1;
    } else {
            /* count all the most similar ones */
            for (best_similarity = main_cmds.names[n++]->len;
                    (n < main_cmds.cnt &&
                    best_similarity == main_cmds.names[n]->len);
                    n++)
                    ; /* still counting */
    }
    if (autocorrect && n == 1 && SIMILAR_ENOUGH(best_similarity)) {
            const char *assumed = main_cmds.names[0]->name;
            main_cmds.names[0] = NULL;
            clean_cmdnames(&main_cmds);
            fprintf_ln(stderr,
                        _("WARNING: You called a Git command named '%s', "
                            "which does not exist."),
                        cmd);
            if (autocorrect == AUTOCORRECT_IMMEDIATELY)
                    fprintf_ln(stderr,
                                _("Continuing under the assumption that "
                                    "you meant '%s'."),
                                assumed);
            else if (autocorrect == AUTOCORRECT_PROMPT) {
                    char *answer;
                    struct strbuf msg = STRBUF_INIT;
                    strbuf_addf(&msg, _("Run '%s' instead [y/N]? "), assumed);
                    answer = git_prompt(msg.buf, PROMPT_ECHO);
                    strbuf_release(&msg);
                    if (!(starts_with(answer, "y") ||
                            starts_with(answer, "Y")))
                            exit(1);
            } else {
                    fprintf_ln(stderr,
                                _("Continuing in %0.1f seconds, "
                                    "assuming that you meant '%s'."),
                                (float)autocorrect/10.0, assumed);
                    sleep_millisec(autocorrect * 100);
            }
            return assumed;
    }

    fprintf_ln(stderr, _("git: '%s' is not a git command. See 'git --help'."), cmd);

    if (SIMILAR_ENOUGH(best_similarity)) {
            fprintf_ln(stderr,
                        Q_("\nThe most similar command is",
                            "\nThe most similar commands are",
                        n));

            for (i = 0; i < n; i++)
                    fprintf(stderr, "\t%s\n", main_cmds.names[i]->name);
    }

    exit(1);
~~~

似乎有点长，有个关键词：levenshtein distance，算半个老朋友嘛~~how old are you?~~。

<br>

我记得，用一句话概括这个算法就是：

> 有两个字符串A和B，每次只增加/删除/修改A的一个字（或者字母，标点符号），需要多少次能把A改成B，这个次数就是A和B之间的距离。

``cmd``是命令行输入中跟在``git``后面的第一个参数，``main_cmds`` 包含``git``提供的参数（或者叫subcommand吧）,``common_cmds``似乎是包含了help信息的参数列表。~~说实话，没看懂，大概明白得了。~~``i``是遍历``main_cmds.names``时使用的index，``n``是遍历``common_cmds``时使用的index。

<br>

先手动查，如果是已知命令，那就把对应距离改成0。否则计算逻辑距离。

<br>

计算逻辑距离：

~~~ c
# levenshtein.c
int levenshtein(const char *string1, const char *string2,
		int w, int s, int a, int d)
{
	int len1 = strlen(string1), len2 = strlen(string2);
	int *row0, *row1, *row2;
	int i, j;

	ALLOC_ARRAY(row0, len2 + 1);
	ALLOC_ARRAY(row1, len2 + 1);
	ALLOC_ARRAY(row2, len2 + 1);

	for (j = 0; j <= len2; j++)
		row1[j] = j * a;
	for (i = 0; i < len1; i++) {
		int *dummy;

		row2[0] = (i + 1) * d;
		for (j = 0; j < len2; j++) {
			/* substitution */
			row2[j + 1] = row1[j] + s * (string1[i] != string2[j]);
			/* swap */
			if (i > 0 && j > 0 && string1[i - 1] == string2[j] &&
					string1[i] == string2[j - 1] &&
					row2[j + 1] > row0[j - 1] + w)
				row2[j + 1] = row0[j - 1] + w;
			/* deletion */
			if (row2[j + 1] > row1[j + 1] + d)
				row2[j + 1] = row1[j + 1] + d;
			/* insertion */
			if (row2[j + 1] > row2[j] + a)
				row2[j + 1] = row2[j] + a;
		}

		dummy = row0;
		row0 = row1;
		row1 = row2;
		row2 = dummy;
	}

	i = row1[len2];
	free(row0);
	free(row1);
	free(row2);

	return i;
}
~~~

记录一下，以后可以借鉴（不是）。

## shutdown

我记得``shutdown``支持``today``，``tomorrow``这种单词，刚才试了试怎么不认识。不能是我记错了吧？

<br>

查了查似乎``at``命令可以这样玩，下次再写吧。

<br>

一定是我太困了，该睡了，晚安。
