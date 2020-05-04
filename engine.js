'format cjs';

const wrap = require('word-wrap');
const map = require('lodash.map');
const longest = require('longest');
const chalk = require('chalk');
const fs = require('fs');
const find = require('findup-sync');

function branch() {
  return parseBranch(fs.readFileSync(gitHeadPath()));
}

function parseBranch(buf) {
  const match = /ref: refs\/heads\/([^\n]+)/.exec(buf.toString());
  return match ? match[1] : null;
}

function gitHeadPath() {
  const filepath = find('.git/HEAD', { cwd: process.cwd() });
  if (!fs.existsSync(filepath)) {
    throw new Error('.git/HEAD does not exist');
  }
  return filepath;
}


const filter = function(array) {
  return array.filter(function(x) {
    return x;
  });
};

const headerLength = function(answers) {
  return (
    answers.type.length + 2 + (answers.scope ? answers.scope.length + 2 : 0)
  );
};

const maxSummaryLength = function(options, answers, branch) {
  return options.maxHeaderWidth - headerLength(answers) - (answers.prefixWithBranchName ? branch.length + 1 : 0);
};

const filterSubject = function(subject) {
  subject = subject.trim();
  if (subject.charAt(0).toLowerCase() !== subject.charAt(0)) {
    subject =
      subject.charAt(0).toLowerCase() + subject.slice(1, subject.length);
  }
  while (subject.endsWith('.')) {
    subject = subject.slice(0, subject.length - 1);
  }
  return subject;
};

module.exports = function(options) {

  const types = options.types;
  const prefixWithBranch = options.prefixWithBranch;

  const length = longest(Object.keys(types)).length + 1;
  const choices = map(types, function(type, key) {
    return {
      name: (key + ':').padEnd(length) + ' ' + type.description,
      value: key
    };
  });
  const branchName = branch();

  return {
    // When a user runs `git cz`, prompter will
    // be executed. We pass you cz, which currently
    // is just an instance of inquirer.js. Using
    // this you can ask questions and get answers.
    //
    // The commit callback should be executed when
    // you're ready to send back a commit template
    // to git.
    //
    // By default, we'll de-indent your commit
    // template and will keep empty lines.
    prompter: function(cz, commit) {
      // Let's ask some questions of the user
      // so that we can populate our commit
      // template.
      //
      // See inquirer.js docs for specifics.
      // You can also opt to use another input
      cz.prompt([
        {
          type: 'list',
          name: 'type',
          message: "Select the type of change that you're committing:",
          choices: choices,
          default: options.defaultType
        },
        {
          type: 'input',
          name: 'scope',
          message:
            'What is the scope of this change (e.g. component or file name): (press enter to skip)',
          default: options.defaultScope,
          filter: function(value) {
            return options.disableScopeLowerCase
              ? value.trim()
              : value.trim().toLowerCase();
          }
        },
        // Only add this question if the prefixWithBranch is set in config in package.json
        ...(prefixWithBranch ? [{
          type: 'confirm',
          name: 'prefixWithBranchName',
          message: `Do you want to prefix the subject with ${branchName}?`,
          default: false
        }] : []),
        {
          type: 'input',
          name: 'subject',
          message: function(answers) {
            return (
              'Write a short, imperative tense description of the change (max ' +
              maxSummaryLength(options, answers, branchName) +
              ' chars):\n'
            );
          },
          default: options.defaultSubject,
          validate: function(subject, answers) {
            const filteredSubject = filterSubject(subject);
            return filteredSubject.length == 0
              ? 'subject is required'
              : filteredSubject.length <= maxSummaryLength(options, answers, branchName)
              ? true
              : 'Subject length must be less than or equal to ' +
                maxSummaryLength(options, answers, branchName) +
                ' characters. Current length is ' +
                filteredSubject.length +
                ' characters.';
          },
          transformer: function(subject, answers) {
            const filteredSubject = filterSubject(subject);
            const color =
              filteredSubject.length <= maxSummaryLength(options, answers, branchName)
                ? chalk.green
                : chalk.red;
            return color('(' + filteredSubject.length + ') ' + subject);
          },
          filter: function(subject) {
            return filterSubject(subject);
          }
        },
        {
          type: 'input',
          name: 'body',
          message:
            'Provide a longer description of the change: (press enter to skip)\n',
          default: options.defaultBody
        },
        {
          type: 'confirm',
          name: 'isBreaking',
          message: 'Are there any breaking changes?',
          default: false
        },
        {
          type: 'input',
          name: 'breakingBody',
          default: '-',
          message:
            'A BREAKING CHANGE commit requires a body. Please enter a longer description of the commit itself:\n',
          when: function(answers) {
            return answers.isBreaking && !answers.body;
          },
          validate: function(breakingBody, answers) {
            return (
              breakingBody.trim().length > 0 ||
              'Body is required for BREAKING CHANGE'
            );
          }
        },
        {
          type: 'input',
          name: 'breaking',
          message: 'Describe the breaking changes:\n',
          when: function(answers) {
            return answers.isBreaking;
          }
        },
      ]).then(function(answers) {
        const wrapOptions = {
          trim: true,
          cut: false,
          newline: '\n',
          indent: '',
          width: options.maxLineWidth
        };

        // parentheses are only needed when a scope is present
        const scope = answers.scope ? '(' + answers.scope + ')' : '';

        // Hard limit this line in the validate
        const head = answers.type + scope + ': ' + (answers.prefixWithBranchName ? `#${branch()} ` : '') + answers.subject;

        // Wrap these lines at options.maxLineWidth characters
        const body = answers.body ? wrap(answers.body, wrapOptions) : false;

        // Apply breaking change prefix, removing it if already present
        let breaking = answers.breaking ? answers.breaking.trim() : '';
        breaking = breaking
          ? 'BREAKING CHANGE: ' + breaking.replace(/^BREAKING CHANGE: /, '')
          : '';
        breaking = breaking ? wrap(breaking, wrapOptions) : false;

        commit(filter([head, body, breaking]).join('\n\n'));
      });
    }
  };
};
