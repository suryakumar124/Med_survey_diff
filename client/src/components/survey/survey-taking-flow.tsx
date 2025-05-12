// client/src/components/survey/survey-taking-flow.tsx
import React, { useState, useEffect } from 'react';
import { SurveyQuestion } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface SurveyTakingFlowProps {
  questions: SurveyQuestion[];
  onSubmit: (responses: any[]) => void;
  onSave: (responses: any[]) => void;
}

export function SurveyTakingFlow({ questions, onSubmit, onSave }: SurveyTakingFlowProps) {
  const [responses, setResponses] = useState<{[key: number]: any}>({});
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [questionPath, setQuestionPath] = useState<number[]>([]);
  
  // Initialize with the first question
  useEffect(() => {
    if (questions.length > 0) {
      const firstQuestion = questions.find(q => 
        // Find a question that doesn't have conditional logic or is the first in order
        !q.conditionalLogic || q.orderIndex === 0
      ) || questions[0];
      
      setCurrentQuestionId(firstQuestion.id);
      setQuestionPath([firstQuestion.id]);
    }
  }, [questions]);
  
  // Get the current question object
  const currentQuestion = questions.find(q => q.id === currentQuestionId);
  
  // Find the next question based on conditional logic
  const findNextQuestion = (currentQ: SurveyQuestion, answer: any): number | null => {
    if (!currentQ.conditionalLogic) {
      // If no conditional logic, go to the next question by orderIndex
      const nextQByOrder = questions.find(q => q.orderIndex === currentQ.orderIndex + 1);
      return nextQByOrder?.id || null;
    }
    
    try {
      const logic = JSON.parse(currentQ.conditionalLogic);
      
      // For MCQ questions, check if there's a branch for this answer
      if (currentQ.questionType === 'mcq' && logic.branches && logic.branches[answer]) {
        return logic.branches[answer];
      }
      
      // Otherwise, use the default next question
      return logic.nextQuestionId || null;
    } catch (e) {
      console.error('Error parsing conditional logic', e);
      return null;
    }
  };
  
  // Handle question answer
  const handleAnswer = (answer: any) => {
    // Save the response
    setResponses(prev => ({
      ...prev,
      [currentQuestionId!]: answer
    }));
    
    // Auto-save progress
    const updatedResponses = [
      ...Object.entries(responses).map(([qId, response]) => ({
        questionId: parseInt(qId),
        response
      })),
      { questionId: currentQuestionId!, response: answer }
    ];
    onSave(updatedResponses);
    
    // Find next question
    if (currentQuestion) {
      const nextQuestionId = findNextQuestion(currentQuestion, answer);
      
      if (nextQuestionId) {
        setCurrentQuestionId(nextQuestionId);
        setQuestionPath(prev => [...prev, nextQuestionId]);
      } else {
        // If no next question, we've reached the end
        handleSubmit();
      }
    }
  };
  
  // Handle going back to the previous question
  const handleBack = () => {
    if (questionPath.length > 1) {
      const newPath = [...questionPath];
      newPath.pop(); // Remove current question
      const prevQuestionId = newPath[newPath.length - 1];
      setCurrentQuestionId(prevQuestionId);
      setQuestionPath(newPath);
    }
  };
  
  // Handle survey submission
  const handleSubmit = () => {
    const formattedResponses = Object.entries(responses).map(([qId, response]) => ({
      questionId: parseInt(qId),
      response
    }));
    
    onSubmit(formattedResponses);
  };
  
  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p>No questions available for this survey.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="mb-2">
              Question {questionPath.length} of {questionPath.length}
              {currentQuestion.required && (
                <span className="ml-2 text-red-500">*</span>
              )}
            </Badge>
            <CardTitle>{currentQuestion.questionText}</CardTitle>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {currentQuestion.questionType === 'text' && (
          <Textarea 
            placeholder="Enter your answer" 
            value={responses[currentQuestion.id] || ''}
            onChange={(e) => setResponses(prev => ({
              ...prev,
              [currentQuestion.id]: e.target.value
            }))}
            rows={4}
          />
        )}
        
        {currentQuestion.questionType === 'scale' && (
          <div className="flex flex-wrap gap-2 justify-between py-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
              <Button
                key={value}
                variant={responses[currentQuestion.id] === value.toString() ? "default" : "outline"}
                className="w-12 h-12"
                onClick={() => handleAnswer(value.toString())}
              >
                {value}
              </Button>
            ))}
          </div>
        )}
        
        {currentQuestion.questionType === 'mcq' && currentQuestion.options && (
          <div className="space-y-3 py-2">
            {currentQuestion.options.split('\n').map((option, index) => (
              <Button
                key={index}
                variant={responses[currentQuestion.id] === option ? "default" : "outline"}
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => handleAnswer(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <Button 
          variant="outline" 
          onClick={handleBack}
          disabled={questionPath.length <= 1}
        >
          Back
        </Button>
        
        {currentQuestion.questionType !== 'scale' && currentQuestion.questionType !== 'mcq' && (
          <Button 
            onClick={() => handleAnswer(responses[currentQuestion.id] || '')}
            disabled={currentQuestion.required && !responses[currentQuestion.id]}
          >
            Next
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}