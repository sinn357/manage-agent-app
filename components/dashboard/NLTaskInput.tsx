'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ParsedTask, NLParseResult } from '@/types/nlTask';
import toast from 'react-hot-toast';

interface NLTaskInputProps {
  onTaskCreated: () => void;
}

export default function NLTaskInput({ onTaskCreated }: NLTaskInputProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 파싱된 결과를 수정할 수 있는 상태
  const [editedTask, setEditedTask] = useState<ParsedTask | null>(null);

  useEffect(() => {
    if (parsedTask) {
      setEditedTask({ ...parsedTask });
    }
  }, [parsedTask]);

  const handleParse = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setParsedTask(null);
    setEditedTask(null);

    try {
      const response = await fetch('/api/tasks/parse-nl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() }),
      });

      const result: NLParseResult = await response.json();

      if (result.success) {
        setParsedTask(result.parsed);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Parse error:', error);
      toast.error('파싱에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleParse();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleCreate = async () => {
    if (!editedTask || !editedTask.title.trim()) {
      toast.error('제목을 입력하세요');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTask.title,
          description: editedTask.description,
          scheduledDate: editedTask.scheduledDate,
          scheduledTime: editedTask.scheduledTime,
          scheduledEndTime: editedTask.scheduledEndTime,
          priority: editedTask.priority,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('작업이 생성되었습니다');
        setInput('');
        setParsedTask(null);
        setEditedTask(null);
        onTaskCreated();
      } else {
        toast.error(result.error || '작업 생성에 실패했습니다');
      }
    } catch (error) {
      console.error('Create error:', error);
      toast.error('작업 생성에 실패했습니다');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setParsedTask(null);
    setEditedTask(null);
    setInput('');
    inputRef.current?.focus();
  };

  const updateEditedTask = (field: keyof ParsedTask, value: string) => {
    if (!editedTask) return;
    setEditedTask({ ...editedTask, [field]: value });
  };

  const confidenceColor = editedTask?.confidence
    ? editedTask.confidence >= 0.8
      ? 'text-green-600'
      : editedTask.confidence >= 0.6
      ? 'text-yellow-600'
      : 'text-red-600'
    : '';

  return (
    <div className="mb-4">
      {/* 입력 필드 */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500">
          <Sparkles className="w-4 h-4" />
        </div>
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="자연어로 작업 추가... (예: 내일 오후 3시에 미팅)"
          className="pl-10 pr-20 py-5 bg-white border-purple-200 focus:border-purple-400 focus:ring-purple-400"
          disabled={isLoading}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleParse}
              disabled={!input.trim()}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              AI
            </Button>
          )}
        </div>
      </div>

      {/* 미리보기 카드 */}
      {editedTask && (
        <div className="mt-3 p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">AI가 파싱한 결과</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${confidenceColor}`}>
                {Math.round((editedTask.confidence || 0) * 100)}%
              </span>
              {editedTask.confidence && editedTask.confidence < 0.7 && (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
            </div>
          </div>

          <div className="space-y-3">
            {/* 제목 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">제목</label>
              <Input
                value={editedTask.title}
                onChange={(e) => updateEditedTask('title', e.target.value)}
                className="text-sm"
              />
            </div>

            {/* 날짜 & 시간 */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">날짜</label>
                <Input
                  type="date"
                  value={editedTask.scheduledDate || ''}
                  onChange={(e) => updateEditedTask('scheduledDate', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">시작</label>
                <Input
                  type="time"
                  value={editedTask.scheduledTime || ''}
                  onChange={(e) => updateEditedTask('scheduledTime', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">종료</label>
                <Input
                  type="time"
                  value={editedTask.scheduledEndTime || ''}
                  onChange={(e) => updateEditedTask('scheduledEndTime', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* 우선순위 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">우선순위</label>
              <Select
                value={editedTask.priority}
                onValueChange={(value) => updateEditedTask('priority', value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">높음</SelectItem>
                  <SelectItem value="mid">보통</SelectItem>
                  <SelectItem value="low">낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isCreating}
            >
              <X className="w-4 h-4 mr-1" />
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={isCreating || !editedTask.title.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-1" />
              )}
              생성
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
