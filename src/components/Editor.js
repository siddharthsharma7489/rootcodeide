import React, { useEffect, useRef, useState } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

const Editor = ({ socketRef, roomId, onCodeChange }) => {
    const editorRef = useRef(null);
    const [compiledCode, setCompiledCode] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('63');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);

    const LANGUAGES = [
        {
            code: "63",
            language: "javascript",
        },
        {
            code: "71",
            language: "python",
        },
        {
            code: "54",
            language: "c++",
        },
        {
            code: "49",
            language: "c",
        }
    ]
    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: { name: 'javascript', json: true },
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                }
            );

            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue();
                onCodeChange(code);
                if (origin !== 'setValue') {
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,
                    });
                }
            });
        }
        init();
    }, []);

    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                if (code !== null) {
                    editorRef.current.setValue(code);
                }
            });
        }

        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE);
        };
    }, [socketRef.current]);

    const compileCode = () => {
        try {
            const code = editorRef.current.getValue();
            setLoading(true);
            // Replace this with your actual compilation logic
            const compiledResult = compileFunction(code);
        } catch (error) {
            console.error('Compilation error:', error);
            setCompiledCode('Compilation failed');
            setLoading(false);
        }
    };

    const handleLanguageChange = (event) => {
        const selectedValue = event.target.value;
        setSelectedLanguage(selectedValue);
        const selectedLanguageObj = LANGUAGES.find(lang => lang.code === selectedValue);

        // Set the mode of CodeMirror editor to the corresponding language
        if (selectedLanguageObj) {
            editorRef.current.setOption('mode', { name: selectedLanguage.language, json: true });
        }
    };

    const fetchToken = async (code) => {
        const response = await fetch(
            "https://judge0-ce.p.rapidapi.com/submissions",
            {
              method: "POST",
              headers: {
                "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
                "x-rapidapi-key": "c16d7c2a60mshe16696ce11f0e4dp1233b6jsncd41479173f2", // Get yours for free at https://rapidapi.com/judge0-official/api/judge0-ce/
                "content-type": "application/json",
                accept: "application/json",
              },
              body: JSON.stringify({
                source_code: code,
                stdin: '',
                language_id: selectedLanguage,
              }),
            }
          );
        
          const jsonResponse = await response.json();
      if (jsonResponse.token) {
        setToken(jsonResponse.token);
        const intervalId = setTimeout(async () => {
            await fetchResult(jsonResponse.token);
            clearTimeout(intervalId);
        }, 10000);
      } else {
        console.log('error');
        setLoading(false);
      }
    }

    const fetchResult = async (token) => {
        let url = `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=false`;
        const getSolution = await fetch(url, {
          method: "GET",
          headers: {
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
            "x-rapidapi-key": "c16d7c2a60mshe16696ce11f0e4dp1233b6jsncd41479173f2", // Get yours for free at https://rapidapi.com/judge0-official/api/judge0-ce/
            "content-type": "application/json",
          },
        })
        .then(res => res.json())
        .then((res) => {
            console.log(res.stdout);
            if(res.stdout) {
                console.log('here');
                setCompiledCode(res.stdout);
                setLoading(false);
            } else {
                setCompiledCode(res.stderr);
                setLoading(false);
            }
        })
        .catch((e) => {
            setCompiledCode(`Error ${e}`);
                setLoading(false);
        })
        
    };

    const compileFunction = (code) => {
        fetchToken(code);
    };

    return (
        <div>
            <div className='language-layout'>
                <label id="language-label" htmlFor="language">Select Language:</label>
                <select id="language" onChange={handleLanguageChange} value={selectedLanguage}>
                    <option value="63">JavaScript</option>
                    <option value="71">Python</option>
                    <option value="54">C++</option>
                    <option value="49">C</option>
                    {/* Add more language options as needed */}
                </select>
            </div>
            <button className="btn compileBtn" onClick={compileCode}>
                Compile
            </button>
            {loading && <div className="loader"></div>}
            <div className="resultWindow">
                <h3>Result</h3>
                <pre>{compiledCode}</pre>
            </div>
            <textarea id="realtimeEditor"></textarea>
        </div>
    );
};

export default Editor;

// Replace this function with your actual compilation logic
