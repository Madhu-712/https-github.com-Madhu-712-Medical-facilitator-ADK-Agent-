
import React, { useState, useCallback, useMemo } from 'react';
import { AgentStatus } from './types';
import type { UploadedFile } from './types';
import { retrieveDataFromText, generateFinalReport } from './services/geminiService';
import { BrainCircuitIcon, DownloadCloudIcon, FileTextIcon, ImageIcon, UploadCloudIcon } from './components/icons';

// Define components inside the same file but outside the main App component
// to prevent re-creation on every render.

interface FileInputProps {
  onFileSelect: (file: UploadedFile) => void;
  selectedFile: UploadedFile | null;
  accept: string;
}

const FileInput: React.FC<FileInputProps> = ({ onFileSelect, selectedFile, accept }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        if (base64) {
          onFileSelect({
            base64,
            mimeType: file.type,
            name: file.name,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        {selectedFile ? (
          <img
            src={`data:${selectedFile.mimeType};base64,${selectedFile.base64}`}
            alt="X-ray preview"
            className="object-contain w-full h-full rounded-lg"
          />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloudIcon className="w-10 h-10 mb-3 text-slate-400" />
            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Click to upload X-ray</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG, or WEBP</p>
          </div>
        )}
        <input id="file-upload" type="file" className="hidden" accept={accept} onChange={handleFileChange} />
      </label>
      {selectedFile && <p className="mt-2 text-sm text-center text-slate-600 dark:text-slate-300 truncate">{selectedFile.name}</p>}
    </div>
  );
};


interface AgentStatusDisplayProps {
    status: AgentStatus;
}

const AgentStatusDisplay: React.FC<AgentStatusDisplayProps> = ({ status }) => {
    const getStatusColor = () => {
        switch (status) {
            case AgentStatus.IDLE:
                return 'text-slate-500';
            case AgentStatus.RETRIEVING_DATA:
            case AgentStatus.GENERATING_REPORT:
            case AgentStatus.SAVING_REPORT:
                return 'text-blue-500 animate-pulse';
            case AgentStatus.DONE:
                return 'text-green-500';
            default:
                return 'text-slate-500';
        }
    };

    return (
        <div className="flex items-center justify-center p-4 my-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <BrainCircuitIcon className={`w-6 h-6 mr-3 ${getStatusColor()}`} />
            <span className={`text-sm font-medium ${getStatusColor()}`}>{status}</span>
        </div>
    );
};


export default function App() {
  const [xrayImage, setXrayImage] = useState<UploadedFile | null>(null);
  const [documentText, setDocumentText] = useState<string>('');
  const [retrievedData, setRetrievedData] = useState<string>('');
  const [finalReport, setFinalReport] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<AgentStatus>(AgentStatus.IDLE);
  const [error, setError] = useState<string | null>(null);

  const isLoading = useMemo(() => currentStatus !== AgentStatus.IDLE && currentStatus !== AgentStatus.DONE, [currentStatus]);

  const handleGenerateReport = useCallback(async () => {
    if (!xrayImage || !documentText) {
      setError('Please upload an X-ray image and provide the document text.');
      return;
    }
    setError(null);
    setRetrievedData('');
    setFinalReport('');

    try {
      setCurrentStatus(AgentStatus.RETRIEVING_DATA);
      const structuredData = await retrieveDataFromText(documentText);
      setRetrievedData(structuredData);

      setCurrentStatus(AgentStatus.GENERATING_REPORT);
      const report = await generateFinalReport(structuredData, xrayImage);
      setFinalReport(report);

      setCurrentStatus(AgentStatus.SAVING_REPORT);
      // Simulate saving to GCS
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCurrentStatus(AgentStatus.DONE);

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setCurrentStatus(AgentStatus.IDLE);
    }
  }, [xrayImage, documentText]);
  
  const handleDownloadReport = () => {
    const blob = new Blob([finalReport], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medical-facilitator-report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isButtonDisabled = isLoading || !xrayImage || !documentText;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <header className="bg-white dark:bg-slate-950/70 backdrop-blur-sm shadow-md p-4 text-center sticky top-0 z-10">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Medical Facilitator AI</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">An interactive agent-based system for medical data interpretation.</p>
      </header>

      <main className="p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Inputs Column */}
          <div className="space-y-8">
            {/* X-ray Input */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <ImageIcon className="w-6 h-6 mr-3 text-blue-500" />
                <h2 className="text-xl font-semibold">1. Upload X-Ray Image</h2>
              </div>
              <FileInput onFileSelect={setXrayImage} selectedFile={xrayImage} accept="image/png, image/jpeg, image/webp" />
            </div>

            {/* Document Text Input */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                    <FileTextIcon className="w-6 h-6 mr-3 text-blue-500" />
                    <h2 className="text-xl font-semibold">2. Paste Document Text</h2>
                </div>
                <textarea
                    value={documentText}
                    onChange={(e) => setDocumentText(e.target.value)}
                    placeholder="Paste the text from your medical PDF document here..."
                    className="w-full h-64 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
            </div>
          </div>
          
          {/* Outputs Column */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-center">3. Generate & View Report</h2>
            <div className="flex-grow space-y-4 flex flex-col">
                <button
                    onClick={handleGenerateReport}
                    disabled={isButtonDisabled}
                    className="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed dark:disabled:bg-slate-600 transition-all duration-300 ease-in-out"
                >
                    {isLoading ? 'Processing...' : 'Generate Final Report'}
                </button>
                
                {error && <div className="p-3 text-sm text-red-800 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-lg text-center">{error}</div>}

                <AgentStatusDisplay status={currentStatus} />

                <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                    {retrievedData && (
                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2 text-slate-700 dark:text-slate-200">Data Retriever Agent Output:</h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-slate-600 dark:text-slate-300">{retrievedData}</div>
                        </div>
                    )}

                    {finalReport && (
                        <div className="p-4 border border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50/50 dark:bg-blue-900/20">
                            <h3 className="font-semibold text-lg mb-2 text-blue-800 dark:text-blue-300">Medical Facilitator Agent - Final Report:</h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{finalReport}</div>
                             <button
                                onClick={handleDownloadReport}
                                className="mt-4 flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                            >
                                <DownloadCloudIcon className="w-5 h-5 mr-2" />
                                Download Report (Simulates GCS Save)
                            </button>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
