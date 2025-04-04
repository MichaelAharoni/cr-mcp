# cr-mcp

## Description
Code Review Model Context Protocol (CR-MCP) server for managing GitHub pull request comments.

## Installation

```bash
npm install
npm run build
```

## Usage

### Running the server locally

```bash
npm start --gh_api_key=your_github_api_key_here --gh_owner=your_github_owner_here
```

### Required Parameters

#### GitHub API Key

You must provide your GitHub API key as a command line argument when starting the server:

```bash
node dist/server.js --gh_api_key=your_github_api_key_here
```

Or using the short form:

```bash
node dist/server.js -k your_github_api_key_here
```

#### GitHub Owner

You must specify the GitHub owner (organization or user) as a command line argument:

```bash
node dist/server.js --gh_owner=your_github_owner_here
```

Or using the short form:

```bash
node dist/server.js -o your_github_owner_here
```

### Optional Parameters

#### Custom port

You can optionally specify a custom port to run the server on:

```bash
node dist/server.js --port=4000
```

Or using the short form:

```bash
node dist/server.js -p 4000
```

#### Debug mode

You can enable debug mode for additional logging:

```bash
node dist/server.js --debug
```

Or using the short form:

```bash
node dist/server.js -d
```

### Combined options

Options can be combined:

```bash
node dist/server.js --gh_api_key=your_github_api_key_here --gh_owner=your_github_owner_here --port=4000 --debug
```

### Using as an installed package

After installing the package globally or via npx:

```bash
npx cr-mcp --gh_api_key=your_github_api_key_here --gh_owner=your_github_owner_here
```

## API Endpoints

- `POST /fix-pr-comments` - Gets code review comments for a pull request in order the fix them by the agent
- `GET /health` - Health check endpoint