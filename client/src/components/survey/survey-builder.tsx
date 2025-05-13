// client/src/components/survey/survey-builder.tsx
import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  Connection, 
  Edge, 
  Node,
  Handle,
  Position,
  useNodesState, 
  useEdgesState 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SurveyQuestion, Survey } from "@shared/schema";

// Custom node component for questions that includes handles
function QuestionNode({ data, selected }) {
  return (
    <div className="relative">
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-gray-400" 
      />
      <Card className={`w-64 ${selected ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader className="p-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium">
              {data.questionType === 'mcq' ? '🔘' : 
               data.questionType === 'scale' ? '📊' : '📝'} {data.questionText}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {data.questionType.toUpperCase()}
            </Badge>
          </div>
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
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="default"
        className="w-3 h-3 bg-primary" 
      />
      {/* For MCQ, add additional source handles for each option */}
      {data.questionType === 'mcq' && data.options && 
        data.options.split('\n').map((option, i) => (
          <Handle 
            key={i}
            type="source" 
            position={Position.Bottom} 
            id={`option-${i}`}
            className="w-3 h-3 bg-red-500" 
            style={{ left: 10 + (i * 20), bottom: -8 }}
          />
        ))
      }
    </div>
  );
}

// Define node types
const nodeTypes = {
  questionNode: QuestionNode,
};

interface SurveyBuilderProps {
  survey: Survey;
  questions: SurveyQuestion[];
  onSave: (questions: SurveyQuestion[]) => void;
}

export function SurveyBuilder({ survey, questions, onSave }: SurveyBuilderProps) {
  // State for tracking loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert questions to nodes for ReactFlow
  const createInitialNodes = (): Node[] => {
    return questions.map((q, index) => ({
      id: q.id.toString(),
      type: 'questionNode',
      position: { x: 250, y: 100 + index * 200 }, // More vertical spacing
      data: { ...q },
    }));
  };

  // Create edges based on conditional logic
  const createInitialEdges = (): Edge[] => {
    const edges: Edge[] = [];
    
    questions.forEach(question => {
      if (question.conditionalLogic) {
        try {
          const logic = JSON.parse(question.conditionalLogic);
          
          // Add default "next question" edge if specified
          if (logic.nextQuestionId) {
            edges.push({
              id: `e-${question.id}-default-${logic.nextQuestionId}`,
              source: question.id.toString(),
              target: logic.nextQuestionId.toString(),
              sourceHandle: 'default', // Specify the source handle explicitly
              label: 'Default',
              type: 'default',
              style: { strokeWidth: 2 }
            });
          }
          
          // Add branch edges for MCQ options
          if (question.questionType === 'mcq' && logic.branches && question.options) {
            const options = question.options.split('\n');
            
            Object.entries(logic.branches).forEach(([option, targetId], index) => {
              const optionIndex = options.findIndex(opt => opt === option);
              if (optionIndex !== -1) {
                edges.push({
                  id: `e-${question.id}-${option.replace(/\s+/g, '-')}-${targetId}`,
                  source: question.id.toString(),
                  target: targetId.toString(),
                  sourceHandle: `option-${optionIndex}`, // Use the handle ID that matches the option
                  label: `If: ${option}`,
                  type: 'option',
                  style: { stroke: '#ff0072', strokeWidth: 2 }
                });
              }
            });
          }
        } catch (e) {
          console.error('Error parsing conditional logic', e);
          setError(`Error parsing logic for question ${question.id}: ${e.message}`);
        }
      }
    });
    
    return edges;
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(createInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(createInitialEdges());
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Re-initialize nodes and edges when questions change
  useEffect(() => {
    setNodes(createInitialNodes());
    setEdges(createInitialEdges());
  }, [questions]);

  // Handle connecting nodes (creating new edges)
  const onConnect = useCallback((connection: Connection) => {
    // Create a more specific edge ID to avoid conflicts
    const edgeId = `e-${connection.source}-${connection.sourceHandle || 'default'}-${connection.target}`;
    
    setEdges(edges => addEdge({
      ...connection,
      id: edgeId,
      label: connection.sourceHandle === 'default' ? 'Default' : 'Custom',
      style: connection.sourceHandle === 'default' 
        ? { strokeWidth: 2 } 
        : { stroke: '#ff0072', strokeWidth: 2 }
    }, edges));
  }, [setEdges]);

  // Handle node selection
  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  // Handle saving the updated flow
  const handleSave = () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert nodes and edges back to questions with conditional logic
      const updatedQuestions = questions.map(q => {
        // Find the corresponding node
        const node = nodes.find(n => n.id === q.id.toString());
        if (!node) return q;
        
        // Find all outgoing edges from this node
        const nodeEdges = edges.filter(e => e.source === node.id);
        
        // Build conditional logic based on edges
        if (nodeEdges.length > 0) {
          const conditionalLogic: any = {};
          
          // Find default edge (no condition or default sourceHandle)
          const defaultEdge = nodeEdges.find(e => 
            e.sourceHandle === 'default' || 
            (e.label && e.label === 'Default')
          );
          
          if (defaultEdge) {
            conditionalLogic.nextQuestionId = parseInt(defaultEdge.target);
          }
          
          // Find branch edges for MCQ questions
          if (q.questionType === 'mcq' && q.options) {
            const options = q.options.split('\n');
            const branchEdges = nodeEdges.filter(e => 
              e.sourceHandle && e.sourceHandle.startsWith('option-')
            );
            
            if (branchEdges.length > 0) {
              conditionalLogic.branches = {};
              
              branchEdges.forEach(edge => {
                if (edge.sourceHandle) {
                  // Extract option index from the sourceHandle (e.g., "option-0" -> 0)
                  const optionIndex = parseInt(edge.sourceHandle.split('-')[1]);
                  if (!isNaN(optionIndex) && optionIndex < options.length) {
                    const option = options[optionIndex];
                    conditionalLogic.branches[option] = parseInt(edge.target);
                  }
                } else if (edge.label && edge.label.startsWith('If: ')) {
                  // Fallback to using the label
                  const option = edge.label.replace('If: ', '');
                  if (options.includes(option)) {
                    conditionalLogic.branches[option] = parseInt(edge.target);
                  }
                }
              });
            }
          }
          
          return {
            ...q,
            conditionalLogic: JSON.stringify(conditionalLogic)
          };
        }
        
        return q;
      });
      
      onSave(updatedQuestions);
    } catch (error) {
      console.error('Error saving survey flow:', error);
      setError(`Failed to save survey flow: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full border rounded-md">
      {error && (
        <div className="bg-red-50 text-red-600 p-2 text-sm border-b">
          {error}
        </div>
      )}
      
      <div className="flex-grow relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.5}
          maxZoom={1.5}
          defaultZoom={0.8}
        >
          <Background gap={16} size={1} />
          <Controls />
        </ReactFlow>
      </div>
      
      <div className="p-4 border-t flex justify-between items-center">
        <div>
          {selectedNode && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
            >
              Edit Question Flow
            </Button>
          )}
        </div>
        <Button 
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Survey Flow'}
        </Button>
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
  useEffect(() => {
    const newConnections: {[key: string]: string} = {};
    
    // Find all outgoing edges from this node
    const nodeEdges = edges.filter(e => e.source === node.id);
    
    // Set default connection
    const defaultEdge = nodeEdges.find(e => 
      e.sourceHandle === 'default' || 
      (e.label && e.label === 'Default')
    );
    
    if (defaultEdge) {
      newConnections['default'] = defaultEdge.target;
    }
    
    // Set branch connections for MCQ questions
    if (questionData.questionType === 'mcq' && questionData.options) {
      const options = questionData.options.split('\n');
      
      options.forEach((option, index) => {
        // First try to find by option string in label
        let branchEdge = nodeEdges.find(e => e.label === `If: ${option}`);
        
        // If not found, try by sourceHandle
        if (!branchEdge) {
          branchEdge = nodeEdges.find(e => e.sourceHandle === `option-${index}`);
        }
        
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
        id: `e-${node.id}-default-${connections['default']}`,
        source: node.id,
        target: connections['default'],
        sourceHandle: 'default',
        label: 'Default',
        style: { strokeWidth: 2 }
      });
    }
    
    // Add branch connections for MCQ
    if (questionData.questionType === 'mcq' && questionData.options) {
      const options = questionData.options.split('\n');
      
      options.forEach((option, index) => {
        if (connections[option]) {
          updatedEdges.push({
            id: `e-${node.id}-${option.replace(/\s+/g, '-')}-${connections[option]}`,
            source: node.id,
            target: connections[option],
            sourceHandle: `option-${index}`,
            label: `If: ${option}`,
            style: { stroke: '#ff0072', strokeWidth: 2 }
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
          <DialogTitle>Edit Question Flow</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <h3 className="mb-2 text-sm font-medium">Question</h3>
            <div className="p-3 bg-muted rounded-md">
              {questionData.questionText}
            </div>
          </div>
          
          {questionData.questionType === 'mcq' && questionData.options && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Options</h3>
              <div className="space-y-3">
                {questionData.options.split('\n').map((option, i) => (
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