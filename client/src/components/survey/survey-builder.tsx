// client/src/components/survey/survey-builder.tsx
import React, { useState, useCallback } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  Connection, 
  Edge, 
  Node,
  NodeTypes,
  useNodesState, 
  useEdgesState 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SurveyQuestion, Survey } from "@shared/schema";

// Node types
const nodeTypes = {
  questionNode: QuestionNode,
};

// Custom node component for questions
function QuestionNode({ data, selected }) {
  return (
    <Card className={`w-64 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-medium">
          {data.questionType === 'mcq' ? '🔘' : 
           data.questionType === 'scale' ? '📊' : '📝'} {data.questionText}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {data.questionType === 'mcq' && data.options && (
          <div className="text-xs">
            {data.options.split('\n').map((option, i) => (
              <div key={i} className="mb-1">{option}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SurveyBuilderProps {
  survey: Survey;
  questions: SurveyQuestion[];
  onSave: (questions: SurveyQuestion[]) => void;
}

export function SurveyBuilder({ survey, questions, onSave }: SurveyBuilderProps) {
  // Convert questions to nodes for ReactFlow
  const initialNodes: Node[] = questions.map((q, index) => ({
    id: q.id.toString(),
    type: 'questionNode',
    position: { x: 250, y: 100 + index * 150 }, // Position questions vertically
    data: { ...q },
  }));

  // Create edges based on conditional logic
  const initialEdges: Edge[] = [];
  questions.forEach(question => {
    if (question.conditionalLogic) {
      try {
        const logic = JSON.parse(question.conditionalLogic);
        
        // Add default "next question" edge if specified
        if (logic.nextQuestionId) {
          initialEdges.push({
            id: `e-${question.id}-${logic.nextQuestionId}`,
            source: question.id.toString(),
            target: logic.nextQuestionId.toString(),
            label: 'Default',
          });
        }
        
        // Add branch edges for MCQ options
        if (question.questionType === 'mcq' && logic.branches) {
          Object.entries(logic.branches).forEach(([option, targetId]) => {
            initialEdges.push({
              id: `e-${question.id}-${option}-${targetId}`,
              source: question.id.toString(),
              target: targetId.toString(),
              label: `If: ${option}`,
              style: { stroke: '#ff0072' },
            });
          });
        }
      } catch (e) {
        console.error('Error parsing conditional logic', e);
      }
    }
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Handle connecting nodes (creating new edges)
  const onConnect = useCallback((connection: Connection) => {
    setEdges(edges => addEdge({
      ...connection,
      label: 'Default',
    }, edges));
  }, [setEdges]);

  // Handle node selection
  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  const handleSave = () => {
  // Convert nodes and edges back to questions with conditional logic
  const updatedQuestions = questions.map(q => {
    // Find the corresponding node
    const node = nodes.find(n => n.id === q.id.toString());
    if (!node) return q;
    
    // Find all outgoing edges from this node
    const nodeEdges = edges.filter(e => e.source === node.id);
    
    // Build conditional logic based on edges
    let conditionalLogic = null;
    
    if (nodeEdges.length > 0) {
      conditionalLogic = {};
      
      // Find default edge (no condition)
      const defaultEdge = nodeEdges.find(e => e.label === 'Default');
      if (defaultEdge) {
        conditionalLogic.nextQuestionId = parseInt(defaultEdge.target);
      }
      
      // Find branch edges
      const branchEdges = nodeEdges.filter(e => e.label && e.label.startsWith('If:'));
      if (branchEdges.length > 0) {
        conditionalLogic.branches = {};
        branchEdges.forEach(edge => {
          const option = edge.label?.replace('If: ', '');
          if (option) {
            conditionalLogic.branches[option] = parseInt(edge.target);
          }
        });
      }
    }
    
    return {
      ...q,
      conditionalLogic: conditionalLogic ? JSON.stringify(conditionalLogic) : null
    };
  });
  
  onSave(updatedQuestions);
};
  return (
    <div className="h-[600px] w-full border rounded-md">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
      
      <div className="p-4 border-t flex justify-between items-center">
        <div>
          {selectedNode && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
            >
              Edit Question
            </Button>
          )}
        </div>
        <Button onClick={handleSave}>Save Survey Flow</Button>
      </div>
      
      {/* Question editing dialog */}
      {selectedNode && (
        <EditQuestionDialog
          open={isEditing}
          onOpenChange={setIsEditing}
          node={selectedNode}
          nodes={nodes}
          edges={edges}
          onSave={(updatedNode, updatedEdges) => {
            setNodes(nodes.map(n => n.id === updatedNode.id ? updatedNode : n));
            setEdges(updatedEdges);
            setIsEditing(false);
          }}
        />
      )}
    </div>
  );
}

interface EditQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: Node;
  nodes: Node[];
  edges: Edge[];
  onSave: (updatedNode: Node, updatedEdges: Edge[]) => void;
}

function EditQuestionDialog({ open, onOpenChange, node, nodes, edges, onSave }: EditQuestionDialogProps) {
  const [questionData, setQuestionData] = useState(node.data);
  const [connections, setConnections] = useState<{[key: string]: string}>({});
  
  // Initialize connections based on existing edges
  React.useEffect(() => {
    const newConnections: {[key: string]: string} = {};
    
    // Find all outgoing edges from this node
    const nodeEdges = edges.filter(e => e.source === node.id);
    
    // Set default connection
    const defaultEdge = nodeEdges.find(e => e.label === 'Default');
    if (defaultEdge) {
      newConnections['default'] = defaultEdge.target;
    }
    
    // Set branch connections
    if (questionData.questionType === 'mcq') {
      const options = questionData.options?.split('\n') || [];
      options.forEach(option => {
        const branchEdge = nodeEdges.find(e => e.label === `If: ${option}`);
        if (branchEdge) {
          newConnections[option] = branchEdge.target;
        }
      });
    }
    
    setConnections(newConnections);
  }, [node, edges, questionData]);
  
  // Handle saving the updated question and connections
  const handleSave = () => {
    const updatedNode = {
      ...node,
      data: questionData
    };
    
    // Remove all existing edges from this node
    let updatedEdges = edges.filter(e => e.source !== node.id);
    
    // Add default connection if set
    if (connections['default']) {
      updatedEdges.push({
        id: `e-${node.id}-default`,
        source: node.id,
        target: connections['default'],
        label: 'Default'
      });
    }
    
    // Add branch connections for MCQ
    if (questionData.questionType === 'mcq') {
      const options = questionData.options?.split('\n') || [];
      options.forEach(option => {
        if (connections[option]) {
          updatedEdges.push({
            id: `e-${node.id}-${option}`,
            source: node.id,
            target: connections[option],
            label: `If: ${option}`,
            style: { stroke: '#ff0072' }
          });
        }
      });
    }
    
    onSave(updatedNode, updatedEdges);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <h3 className="mb-2 text-sm font-medium">Question</h3>
            <div className="p-3 bg-muted rounded-md">
              {questionData.questionText}
            </div>
          </div>
          
          {questionData.questionType === 'mcq' && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Options</h3>
              <div className="space-y-3">
                {questionData.options?.split('\n').map((option, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="p-2 bg-muted rounded-md flex-grow">
                      {option}
                    </div>
                    <select 
                      className="p-2 border rounded-md"
                      value={connections[option] || ''}
                      onChange={(e) => setConnections({
                        ...connections,
                        [option]: e.target.value
                      })}
                    >
                      <option value="">No connection</option>
                      {nodes.filter(n => n.id !== node.id).map(n => (
                        <option key={n.id} value={n.id}>
                          {n.data.questionText}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="mb-2 text-sm font-medium">Default Next Question</h3>
            <select 
              className="w-full p-2 border rounded-md"
              value={connections['default'] || ''}
              onChange={(e) => setConnections({
                ...connections,
                default: e.target.value
              })}
            >
              <option value="">End of survey</option>
              {nodes.filter(n => n.id !== node.id).map(n => (
                <option key={n.id} value={n.id}>
                  {n.data.questionText}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Connections
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}