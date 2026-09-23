# Third-party dependencies

This project calls the separately installed [zotero-mcp-server](https://github.com/54yyyu/zotero-mcp) 0.13.0 (MIT) through the Model Context Protocol. Its source is not copied into this repository. Python dependencies live in the ignored `.venv` directory and retain their own license files.

The JavaScript MCP client uses [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) 1.30.1 (MIT), installed through npm. Transitive packages retain their respective licenses. `package-lock.json` and `requirements.lock` record the dependency versions used for this prototype.

The optional upstream PDF, semantic-search and other extras are not installed by this project's setup. Adding extras can introduce additional dependencies and license terms; review them before distribution. Project configuration and dependency setup do not grant rights to redistribute the reader's papers.
