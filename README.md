# Check SPDX headers

Checks that files have the correct SPDX headers according to a given configuration.

## Table of Contents

- [Preface](#preface)
- [Usage](#usage)
- [Configuration](#configuration)
  - [Configuration file](#configuration-file)
  - [Inputs](#inputs)
  - [Configuration example](#configuration-example)
- [License check](#license-check)
- [Copyright check](#copyright-check)
- [Outputs](#outputs)
- [Organizing rules](#organizing-rules)
- [Ignoring files](#ignoring-files)
- [Contributing](#contributing)
- [License](#license)

## Preface

What are [SPDX IDs](https://spdx.dev/learn/handling-license-info/)?

* An easy way to label your source code’s licenses
* Needs only one new comment line per file
* Human-readable and machine readable

This action enables to configure checks for the following [SPDX headers](https://spdx.dev/learn/handling-license-info/):

* [License](#license-check)
* [Copyright](#copyright-check)

## Usage

Create a configuration file `check-spdx-headers.config.yml` at the root of your repository, containing the rules that you want to enforce.

> [!NOTE]
> Using a configuration file is optional. You can also use the action inputs to define the configuration.

```yaml
# SPDX headers configuration
rules:
  - name: "Source code"
    headers:
      - files:
          - "**/*.js"
        license: "Apache-2.0"
        copyright: "My Company"
ignore:
  - "**/node_modules/**"
reporter: "text"
log: "debug"
```

Example of a GitHub Actions workflow file:

```yaml
name: Check SPDX headers

on: push

jobs:
  check-spdx-headers:
    name: Check SPDX headers
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check
        id: check-spdx-headers
        uses: Telefonica/check-spdx-headers@v1
```

That's it! The action will check the SPDX headers of your files according to the configuration file on every push.

## Configuration

### Configuration file

The configuration file is a YAML file that must be placed at the root of your repository by default (you can also change the path by using the [action inputs](#inputs)). It can contain the following properties:

* `rules`: List of rules to enforce. Each rule must contain the following properties:
  * `name`: Name of the rule. Useful to identify the rule in the output.
  * `headers`: List of files/headers to check, containing the following properties:
    * `files`: File glob pattern to match the files to check or list of glob patterns.
    * `license`: License or list of approved licenses that the files must have. Approved licenses __may be simple SPDX license identifiers like _MIT_, plus-ranges like _EPL-2.0+_, or licenses with exceptions like _Apache-2.0 WITH LLVM_.__ They may not be compound expressions using AND or OR. Further info in the [License](#license) section.
    * `copyright`: Copyright or list of approved copyrights that the files must have. They can be __simple strings or regular expressions__. Further info in the [Copyright](#copyright) section.
    * `ignore`: File glob pattern or list of file glob patterns to ignore in this specific headers check.
  * `ignore`: File glob pattern or list of file glob patterns to ignore in all headers checks in this rule.
* `ignore`: File glob pattern or list of file glob patterns to ignore in all rules.
* `reporter`: Reporter to use. Possible values are `text`, `markdown` and `json`. Default is `text`. Further info in the [Reporters](#reporters) section.
* `log`: Log level to use. Possible values are `silly`, `debug`, `info`, `warning` and `error`. Default is `info`. This option enables logs for the headers check. You can also enable logs for the action itself _(useful if you find any problem while the action is loading the configuration, for example)_ by setting the `ACTIONS_STEP_DEBUG` secret to `true`.
* `failOnError`: Boolean value to determine if the action should fail when a file does not have the correct headers. Default is `true`. You can disable it and get the results in the output if you want to send the results to a Github comment in a PR, for example. See the [Outputs](#outputs) section for more info.

### Inputs

The action also allows to set the configuration by using inputs. When defined, they will override the values in the [configuration file](#configuration-file). The inputs are:

* `configFile`: Path to the configuration file. Default is `check-spdx-headers.config.yml`.
* `reporter`: Reporter to use. Possible values are `text`, `markdown` and `json`. Default is `text`.
* `log`: Log level to use. Possible values are `silly`, `debug`, `info`, `warning` and `error`. Default is `info`.
* `failOnError`: Boolean value to determine if the action should fail when a file does not have the correct headers. Default is `true`.
* `ignore`: Multiline string with file glob pattern or list of file glob patterns to ignore in all headers checks expressed as a YAML list.    
    Example:

    ```yaml
    ignore: |
      - "**/node_modules/**"
      - "**/dist/**"
    ```
* `rules`: Multiline string with rules to enforce expressed as a YAML list. Read the [Configuration File](#configuration-file) section for more info.
    Example:

    ```yaml
    rules: |
      - name: "Source code"
        headers:
          - files:
              - "**/*.js"
            license: "Apache-2.0"
    ```
* `config`: Multiline string with the whole configuration expressed as a YAML object as in the configuration file. It will extend the values defined in the [configuration file](#configuration-file). Any config value that is defined in other inputs will override the values here.
    Example:

    ```yaml
    config: |
      rules:
        - name: "Source code"
          headers:
            - files:
                - "**/*.js"
              license: "Apache-2.0"
      ignore:
        - "**/node_modules/**"
        - "**/dist/**"
      reporter: "markdown"
      log: "debug"
    ```

### Configuration example

> [!TIP]
> Note that you can use the inputs to override the values in the configuration file, or to define the whole configuration if you don't want to use a file.

So, you can use the configuration file, the inputs, or both. The action will merge the values in the following order:

1. Values in the configuration file.
2. Values in the `config` input.
3. Values in the `rules` input.
4. Values in the `ignore` input.
6. The rest of the inputs.

Example of a complex configuration using both the configuration file and the inputs:

```yaml
# Configuration file
rules:
  - name: "Source code"
    headers:
      - files:
          - "**/*.js"
        license:
          - "Apache-2.0"
        copyright: "My Company"
ignore: "**/node_modules/**"
```

```yaml
# GitHub Actions workflow file with inputs
name: Check SPDX headers

on: push

jobs:
  check-spdx-headers:
    name: Check SPDX headers
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check
        id: check-spdx-headers
        uses: Telefonica/check-spdx-headers@v1
        with:
          configFile: "spdx.config.yml"
          # Properties with preference over values defined in any other place
          reporter: "markdown"
          log: "debug"
          failOnError: false
          # Properties overriding the values in the configuration file and in the "config" input
          ignore: |
            - "**/dist/**"
            - "**/node_modules/**"
          rules: |
            - name: "Source code"
              headers:
                - files:
                    - "**/*.js"
                  license: "Apache-2.0"
          # This will extend the values in the configuration file
          config: |
            ignore:
              - "**/node_modules/**"
```

## License check

The license check is done by comparing the license in the SPDX header of the file with the approved licenses defined in the configuration. The approved licenses can be simple SPDX license identifiers like _MIT_, plus-ranges like _EPL-2.0+_, or licenses with exceptions like _Apache-2.0 WITH LLVM_. They may not be compound expressions using AND or OR.

You can define different licenses in different rules, and even in the same rule. __The action will check if the license in the file satisfies any of the approved licenses.__

Example of a configuration file with different licenses for different files:

```yaml
rules:
  - name: "Source code"
    headers:
      - files:
          - "**/*.js"
          - "**/*.ts"
          - "src/**"
        license: "Apache-2.0"
        ignore:
          - "*.config.js"
  - name: "Config files"
    headers:
      - files:
          - "**/*.yml"
          - "*.config.js"
        license:
          - "MIT"
          - "Apache-2.0"
```

In this example, the action will check:
  * That the files with the extensions `.js` (except files in the root folder matching `*.config.js`) and `.ts`, and the files in the `src` directory have the license `Apache-2.0`.
  * That the files with the extensions `.yml` and those in the root folder matching `*.config.js` have the licenses `MIT` or `Apache-2.0`.

> [!NOTE]
> Read the [SPDX License List](https://spdx.org/licenses/) to get the correct identifiers for the licenses you want to use, and the [SPDX License Expressions](https://spdx.dev/learn/handling-license-info/) to get more information about the license expressions.
>
> You can also check the documentation of the [spdx-satisfies][spdx-satisfies](https://github.com/jslicense/spdx-satisfies.js) library, which is used by this action to check the licenses.


## Copyright check

The copyright check is done by comparing the copyright in the SPDX header of the file with the approved copyrights defined in the configuration. The approved copyrights can be:
  * Simple strings.
  * Regular expressions.

You can define different copyrights in different rules, and even in the same rule. __The action will check if the copyright in the file satisfies any of the approved copyrights.__

Example of a configuration file enabling to use different copyrights _(just for the sake of the example, because it could be also done by using a single regular expression)_:

```yaml
rules:
  - name: "Copyright"
    headers:
      - files:
          - "**/*.ts"
          - "**/*.js"
          - "**/*.yml"
        copyright:
          - "\\d{4}(\\s-\\s\\d{4})? Telefónica Innovación Digital and contributors"
          - "\\d{4}(\\s-\\s\\d{4})? Telefónica Innovación Digital"
          - "\\d{4}(\\s-\\s\\d{4})? Telefónica"
```

## Outputs

The action returns the following outputs:

* `valid`: A boolean value indicating if all files have the correct headers according to the configuration. It will be `true` if all files have the correct headers, and `false` otherwise.
* `report`: A report containing details about the result of the headers check. The report can be returned in different formats, that can be defined by using the [`reporter` configuration property](#configuration). The possible values are:
  * `text`: Generates a text report. This is the default reporter.
  * `markdown`: Generates a markdown report. This is very useful if you want to send the results to a GitHub comment in a PR, for example.
  * `json`: Generates a JSON report. This is useful if you want to process the results in a script, for example. __Note that Github Actions outputs are always strings, so you will need to parse the JSON in your workflow.__ The JSON report contains all details about the headers check, including the files that have failed the check, details about the errors, the rule that produced them, etc.

## Organizing rules

Rules are very flexible and can be organized in different ways. You can define as many rules as you want, and each rule can contain as many set of headers and files as you need. Each headers check can enforce the license header, the copyright header, or both.

So, in general terms, you should organize the rules in order to have a clear and easy-to-maintain configuration, and also a clear and easy-to-understand report about the results. Anyway, headers will be enforced no matter how you organize the rules, so this is only a suggestion.

Here you have a pair of __examples__ about how to organize the rules. Note that both examples will enforce the same headers, but they are organized differently:

* By file type: You can define one different rule for each type of file in your repository. For example, one rule for the source code files, another rule for the test files and another one for the configuration files.
  ```yaml
  rules:
    - name: "Source code"
      headers:
        - files:
            - "src/**/*.js"
            - "src/**/*.ts"
          license: "MPL-2.0"
          ignore:
            - "**/*.config.js"
        - files:
            - "utils/**/*.js"
          license: "Apache-2.0"
          ignore:
            - "utils/file-to-ignore.js"
    - name: "Tests"
      headers:
        - files:
            - "**/*.test.js"
            - "**/*.spec.js"
          license: "MPL-2.0"
          ignore:
            - "test/fixtures/**"
    - name: "Config files"
      headers:
        - files:
            - "**/*.yml"
            - "*.config.js"
          license:
            - "MIT"
            - "Apache-2.0"
    - name: "Copyright"
      headers:
        - files:
            - "**/*.ts"
            - "**/*.js"
            - "**/*.yml"
          copyright: "My Company"
  ```
* By license: You can define one rule for each license that you want to enforce in your repository. For example, one rule for the MPL-2.0 license, another rule for the Apache-2.0 license, and another one for files that can have the MIT or the Apache-2.0 license.
  ```yaml
  rules:
    - name: "MPL-2.0"
      headers:
        - files:
            - "src/**/*.js"
            - "src/**/*.ts"
          license: "MPL-2.0"
          ignore:
            - "**/*.config.js"
        - files:
            - "test/*.test.js"
            - "test/*.spec.js"
          license: "MPL-2.0"
          ignore:
            - "test/fixtures/**"
    - name: "Apache-2.0"
      headers:
        - files:
            - "utils/**/*.js"
          license: "Apache-2.0"
          ignore:
            - "utils/file-to-ignore.js"
    - name: "Apache-2.0 or MIT"
      headers:
        - files:
            - "**/*.yml"
            - "**/*.config.js"
          license:
            - "MIT"
            - "Apache-2.0"
    - name: "Copyright"
      headers:
        - files:
            - "**/*.ts"
            - "**/*.js"
            - "**/*.yml"
          copyright: "My Company"
  ```

> [!TIP]
> Note that in both examples the configuration for the Copyright header is the same for the sake of simplicity, but the same mechanism can be applied to the Copyright header. You could combine it with the License header in the existing rules or define different rules for it.

## Ignoring files

Files can be ignored in three different levels:

* In the __headers check of a specific rule__: Then the files will be ignored only in that check.
* In a __specific rule__: Then the files will be ignored in all checks of that rule.
* In the __global configuration__: Then the files will be ignored in all checks of all rules.

> [!IMPORTANT]
> __The ignore patterns are merged__. That means that if you define an ignore pattern in the global configuration, it will be added to all rules, no matter if you define it also in a specific rule or in a specific headers check. The result will be the union of all ignore patterns.

Ignore patterns are added in the following order:

1. Ignore patterns in the global configuration.
2. Ignore patterns in a specific rule.
3. Ignore patterns in a specific headers check.

## Contributing

Please read our [Contributing Guidelines](./.github/CONTRIBUTING.md) for details on how to contribute to this project before submitting a pull request.

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](./LICENSE) file for details. Read the Apache-2.0 FAQ at https://www.apache.org/foundation/license-faq.html

