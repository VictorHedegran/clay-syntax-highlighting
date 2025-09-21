// src/extension.ts (Updated)

import * as vscode from "vscode";

// Define the custom languages we created in package.json
const JS_CLAY_LANG_ID = "javascript-with-clay";
const TS_CLAY_LANG_ID = "typescript-with-clay";

// The "magic comment" sign to look for at the top of the file
const MAGIC_COMMENT = "// @clay";

/**
 * Checks if a document should be switched to a Clay language ID.
 * @param document The text document to check.
 */
function checkAndSetLanguageId(document: vscode.TextDocument): void {
  // Only process JavaScript and TypeScript files
  const validLanguages = [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
  ];
  if (!validLanguages.includes(document.languageId)) {
    return;
  }

  if (document.lineCount > 0) {
    const firstLine = document.lineAt(0).text.trim();

    // Check if the magic comment is present
    if (firstLine === MAGIC_COMMENT) {
      let targetLangId: string | null = null;

      // Determine the original language to select the correct derived ID
      if (
        document.languageId === "javascript" ||
        document.languageId === "javascriptreact"
      ) {
        targetLangId = JS_CLAY_LANG_ID;
      } else if (
        document.languageId === "typescript" ||
        document.languageId === "typescriptreact"
      ) {
        targetLangId = TS_CLAY_LANG_ID;
      }

      if (targetLangId && document.languageId !== targetLangId) {
        // *** This is the key call: dynamically changes the language mode ***
        vscode.languages.setTextDocumentLanguage(document, targetLangId);
        console.log(
          `Switched ${document.fileName} from ${document.languageId} to ${targetLangId}`
        );

        // Show notification to user for feedback
        vscode.window.showInformationMessage(
          `Clay Handlebars syntax enabled for ${document.fileName
            .split("/")
            .pop()}`
        );
      }
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log("Clay Handlebars Extension is now active!");

  // Only check documents when they are opened or changed, not all existing ones
  // This prevents automatic switching when extension first loads

  // Listen for when new documents are opened
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(checkAndSetLanguageId)
  );

  // Listen for when documents are saved (to catch when magic comment is added)
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(checkAndSetLanguageId)
  );

  // Listen for when document content changes (to catch when magic comment is added)
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      // Only check if the first line changed
      const changes = event.contentChanges;
      const hasFirstLineChange = changes.some(
        (change) => change.range.start.line === 0 || change.range.end.line === 0
      );

      if (hasFirstLineChange) {
        checkAndSetLanguageId(event.document);
      }
    })
  );

  // --- BASIC INTELLISENSE STARTER (Targeting the custom language IDs) ---
  const HBS_TAGGED_TEMPLATE_SELECTOR: vscode.DocumentSelector = [
    { language: JS_CLAY_LANG_ID, scheme: "file" },
    { language: TS_CLAY_LANG_ID, scheme: "file" },
  ];

  const provider = vscode.languages.registerCompletionItemProvider(
    HBS_TAGGED_TEMPLATE_SELECTOR,
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        const linePrefix = document
          .lineAt(position)
          .text.substring(0, position.character);

        // Check if we're inside handlebars brackets
        if (linePrefix.includes("{{") && !linePrefix.includes("}}")) {
          const clayHelpers = [
            // String transformation helpers
            {
              name: "pascalCase",
              detail: "pascalCase value",
              documentation:
                "Converts string to PascalCase (e.g., 'user name' → 'UserName')",
              snippet: "pascalCase ${1:value}",
            },
            {
              name: "camelCase",
              detail: "camelCase value",
              documentation: "Converts string to camelCase (from lodash)",
              snippet: "camelCase ${1:value}",
            },
            {
              name: "kebabCase",
              detail: "kebabCase value",
              documentation: "Converts string to kebab-case (from lodash)",
              snippet: "kebabCase ${1:value}",
            },
            {
              name: "snakeCase",
              detail: "snakeCase value",
              documentation: "Converts string to snake_case (from lodash)",
              snippet: "snakeCase ${1:value}",
            },
            {
              name: "startCase",
              detail: "startCase value",
              documentation: "Converts string to Start Case (from lodash)",
              snippet: "startCase ${1:value}",
            },
            {
              name: "pluralize",
              detail: "pluralize value",
              documentation:
                "Converts string to plural form (e.g., 'user' → 'users')",
              snippet: "pluralize ${1:value}",
            },
            {
              name: "singularize",
              detail: "singularize value",
              documentation:
                "Converts string to singular form (e.g., 'users' → 'user')",
              snippet: "singularize ${1:value}",
            },

            // Control flow helpers
            {
              name: "ifCond",
              detail: "#ifCond v1 operator v2",
              documentation:
                "Conditional helper with operators (==, ===, !=, !==, <, <=, >, >=, &&, ||)",
              snippet:
                "#ifCond ${1:value1} ${2:==} ${3:value2}}\n  $4\n{{/ifCond",
            },
            {
              name: "switch",
              detail: "#switch value",
              documentation: "Switch statement helper for multiple conditions",
              snippet:
                "#switch ${1:value}}\n  {{#case ${2:'value1'}}}\n    $3\n  {{/case}}\n  {{#default}}\n    $4\n  {{/default}}\n{{/switch",
            },
            {
              name: "case",
              detail: "#case value",
              documentation: "Case statement for use within switch blocks",
              snippet: "#case ${1:'value'}}}$2{{/case",
            },
            {
              name: "default",
              detail: "#default",
              documentation: "Default case for switch statements",
              snippet: "#default}}$1{{/default",
            },

            // Comparison helpers
            {
              name: "eq",
              detail: "eq v1 v2",
              documentation: "Equals comparison (===)",
              snippet: "eq ${1:value1} ${2:value2}",
            },
            {
              name: "ne",
              detail: "ne v1 v2",
              documentation: "Not equals comparison (!==)",
              snippet: "ne ${1:value1} ${2:value2}",
            },
            {
              name: "lt",
              detail: "lt v1 v2",
              documentation: "Less than comparison (<)",
              snippet: "lt ${1:value1} ${2:value2}",
            },
            {
              name: "gt",
              detail: "gt v1 v2",
              documentation: "Greater than comparison (>)",
              snippet: "gt ${1:value1} ${2:value2}",
            },
            {
              name: "lte",
              detail: "lte v1 v2",
              documentation: "Less than or equal comparison (<=)",
              snippet: "lte ${1:value1} ${2:value2}",
            },
            {
              name: "gte",
              detail: "gte v1 v2",
              documentation: "Greater than or equal comparison (>=)",
              snippet: "gte ${1:value1} ${2:value2}",
            },
            {
              name: "and",
              detail: "and v1 v2 ...",
              documentation: "Logical AND - all values must be truthy",
              snippet: "and ${1:value1} ${2:value2}",
            },
            {
              name: "or",
              detail: "or v1 v2 ...",
              documentation: "Logical OR - at least one value must be truthy",
              snippet: "or ${1:value1} ${2:value2}",
            },

            // Loop helpers
            {
              name: "times",
              detail: "#times n",
              documentation:
                "Repeat block n times with index, first, and last data",
              snippet: "#times ${1:5}}}$2{{/times",
            },
            {
              name: "eachUnique",
              detail: "#eachUnique array property",
              documentation:
                "Iterate over unique values in array, optionally by property",
              snippet: "#eachUnique ${1:array} ${2:property}}}$3{{/eachUnique",
            },
            {
              name: "eachUniqueJSONPath",
              detail: "#eachUniqueJSONPath model jsonPath",
              documentation: "Iterate over unique values selected by JSONPath",
              snippet:
                "#eachUniqueJSONPath ${1:model} ${2:'$.path'}}}$3{{/eachUniqueJSONPath",
            },

            // Utility helpers
            {
              name: "inc",
              detail: "inc value",
              documentation: "Increment numeric value by 1",
              snippet: "inc ${1:value}",
            },
            {
              name: "json",
              detail: "json value",
              documentation:
                "Convert value to formatted JSON string with circular reference handling",
              snippet: "json ${1:value}",
            },
            {
              name: "markdown",
              detail: "markdown value",
              documentation: "Convert markdown text to HTML using marked",
              snippet: "markdown ${1:value}",
            },
            {
              name: "propertyExists",
              detail: "propertyExists context field",
              documentation:
                "Check if property exists in any object within context",
              snippet: "propertyExists ${1:context} ${2:'field.path'}",
            },
            {
              name: "splitAndUseWord",
              detail: "splitAndUseWord string splitWord index",
              documentation:
                "Split string by delimiter and return word at index",
              snippet: "splitAndUseWord ${1:string} ${2:'delimiter'} ${3:0}",
            },

            // Built-in Handlebars helpers
            {
              name: "if",
              detail: "#if condition",
              documentation: "Standard Handlebars conditional block",
              snippet: "#if ${1:condition}}}$2{{/if",
            },
            {
              name: "unless",
              detail: "#unless condition",
              documentation: "Standard Handlebars inverse conditional block",
              snippet: "#unless ${1:condition}}}$2{{/unless",
            },
            {
              name: "each",
              detail: "#each array",
              documentation: "Standard Handlebars iteration block",
              snippet: "#each ${1:array}}}$2{{/each",
            },
            {
              name: "with",
              detail: "#with object",
              documentation: "Standard Handlebars context block",
              snippet: "#with ${1:object}}}$2{{/with",
            },
          ];

          return clayHelpers.map((helper) => {
            const item = new vscode.CompletionItem(
              helper.name,
              vscode.CompletionItemKind.Function
            );
            item.detail = helper.detail;
            item.documentation = new vscode.MarkdownString(
              helper.documentation
            );
            item.insertText = new vscode.SnippetString(helper.snippet);

            // Add sorting priority for commonly used helpers
            const commonHelpers = [
              "pascalCase",
              "camelCase",
              "kebabCase",
              "pluralize",
              "if",
              "each",
            ];
            if (commonHelpers.includes(helper.name)) {
              item.sortText = "0" + helper.name; // Higher priority
            } else {
              item.sortText = "1" + helper.name; // Normal priority
            }

            return item;
          });
        }
        return [];
      },
    },
    "{", // Trigger on opening brace
    " " // Trigger on space (for helper parameters)
  );

  context.subscriptions.push(provider);
}

export function deactivate() {}
