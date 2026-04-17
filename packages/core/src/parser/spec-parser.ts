import { ASTNode, ParsedNode, SpecDocument, Requirement, Scenario } from '../types/index.js';

export class SpecParser {
  parse(markdown: string): SpecDocument {
    const ast = this.parseToAST(markdown);
    return this.astToSpec(ast);
  }

  parseToAST(markdown: string): ASTNode {
    const lines = markdown.split('\n');
    const root: ASTNode = { type: 'document', children: [] };
    const stack: ASTNode[] = [root];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('#')) {
        this.processHeading(trimmed, stack, i, lines);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        this.processListItem(trimmed, stack);
      } else if (trimmed.length > 0) {
        this.processText(trimmed, stack);
      }
    }

    return root;
  }

  private processHeading(line: string, stack: ASTNode[], lineIndex: number, lines: string[]): void {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) return;

    const depth = match[1].length;
    const value = match[2].trim();

    const heading: ASTNode = {
      type: 'heading',
      value,
      depth,
      children: [],
      raw: line,
    };

    // Pop stack until we find the right parent
    while (stack.length > 1) {
      const parent = stack[stack.length - 1];
      if (parent.type === 'document' || (parent.depth !== undefined && parent.depth < depth)) {
        break;
      }
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    parent.children.push(heading);

    // Look ahead to gather content for this section
    const sectionContent: ASTNode[] = [];
    for (let i = lineIndex + 1; i < lines.length; i++) {
      const nextLine = lines[i];
      if (nextLine.match(/^#{1,6}\s/)) break;
      if (nextLine.trim().startsWith('- **WHEN**') || nextLine.trim().startsWith('- **THEN**')) {
        sectionContent.push({
          type: 'text',
          value: nextLine.trim(),
          children: [],
        });
      }
    }

    // Create section container for the heading
    const section: ASTNode = {
      type: 'section',
      value,
      depth,
      children: sectionContent,
      raw: line,
    };
    heading.children.push(section);
    stack.push(section);
  }

  private processListItem(line: string, stack: ASTNode[]): void {
    const content = line.replace(/^[-*]\s+/, '').trim();
    const listItem: ASTNode = {
      type: 'listItem',
      value: content,
      children: [],
    };

    const parent = stack[stack.length - 1];
    
    // Find or create list container
    let list = parent.children.find(child => child.type === 'list');
    if (!list) {
      list = { type: 'list', children: [] };
      parent.children.push(list);
    }
    
    list.children.push(listItem);
  }

  private processText(line: string, stack: ASTNode[]): void {
    const parent = stack[stack.length - 1];
    parent.children.push({
      type: 'text',
      value: line,
      children: [],
    });
  }

  private astToSpec(ast: ASTNode): SpecDocument {
    const doc: SpecDocument = {
      title: '',
      requirements: [],
    };

    // Extract title from first h1
    const h1 = this.findNode(ast, 'heading', 1);
    if (h1) {
      doc.title = h1.value || '';
    }

    // Extract requirements from h3 nodes with "Requirement:" prefix
    const requirementNodes = this.findAllNodes(ast, 'heading', 3).filter(
      node => node.value?.startsWith('Requirement:')
    );

    for (const reqNode of requirementNodes) {
      const requirement = this.parseRequirement(reqNode);
      if (requirement) {
        doc.requirements.push(requirement);
      }
    }

    return doc;
  }

  private parseRequirement(node: ASTNode): Requirement | null {
    const name = node.value?.replace('Requirement:', '').trim() || '';
    if (!name) return null;

    const requirement: Requirement = {
      id: this.generateId(name),
      name,
      description: '',
      scenarios: [],
    };

    // Find description and scenarios from siblings
    const section = node.children[0];
    if (section) {
      // First text node is description
      const textNodes = section.children.filter(child => child.type === 'text');
      if (textNodes.length > 0) {
        requirement.description = textNodes[0].value || '';
      }

      // Find scenario headings (h4)
      const scenarioNodes = section.children.filter(
        child => child.type === 'heading' && child.depth === 4 && child.value?.startsWith('Scenario:')
      );

      for (const scenarioNode of scenarioNodes) {
        const scenario = this.parseScenario(scenarioNode);
        if (scenario) {
          requirement.scenarios.push(scenario);
        }
      }
    }

    return requirement;
  }

  private parseScenario(node: ASTNode): Scenario | null {
    const name = node.value?.replace('Scenario:', '').trim() || '';
    if (!name) return null;

    const scenario: Scenario = {
      id: this.generateId(name),
      name,
      when: [],
      then: [],
    };

    // Extract WHEN/THEN from text nodes
    const section = node.children[0];
    if (section) {
      const textNodes = section.children.filter(child => child.type === 'text');
      
      for (const textNode of textNodes) {
        const text = textNode.value || '';
        const whenMatch = text.match(/-\s*\*\*WHEN\*\*\s+(.+)$/i);
        const thenMatch = text.match(/-\s*\*\*THEN\*\*\s+(.+)$/i);
        
        if (whenMatch) {
          scenario.when.push(whenMatch[1].trim());
        } else if (thenMatch) {
          scenario.then.push(thenMatch[1].trim());
        }
      }
    }

    return scenario;
  }

  private findNode(node: ASTNode, type: string, depth?: number): ASTNode | null {
    if (node.type === type && (depth === undefined || node.depth === depth)) {
      return node;
    }

    for (const child of node.children) {
      const found = this.findNode(child, type, depth);
      if (found) return found;
    }

    return null;
  }

  private findAllNodes(node: ASTNode, type: string, depth?: number): ASTNode[] {
    const results: ASTNode[] = [];

    if (node.type === type && (depth === undefined || node.depth === depth)) {
      results.push(node);
    }

    for (const child of node.children) {
      results.push(...this.findAllNodes(child, type, depth));
    }

    return results;
  }

  private generateId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
