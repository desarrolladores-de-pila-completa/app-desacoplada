import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { API_URL } from '../config/api';

class MyUploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

  upload() {
    return this.loader.file
      .then(file => new Promise((resolve, reject) => {
        // Obtener token CSRF primero
        fetch(`${API_URL}/api/csrf-token`, {
          method: 'GET',
          credentials: 'include'
        })
        .then(res => res.json())
        .then(csrfData => {
          const csrfToken = csrfData.csrfToken;
          const formData = new FormData();
          formData.append('upload', file);

          fetch(`${API_URL}/api/paginas/upload-comment-image`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
              'x-csrf-token': csrfToken
            }
          })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Upload failed: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            if (data.url) {
              resolve({ default: data.url });
            } else {
              reject(data.error || 'Upload failed');
            }
          })
          .catch(error => reject(error));
        })
        .catch(error => reject(error));
      }));
  }

  abort() {
    // Abort upload if needed
  }
}

function MyCustomUploadAdapterPlugin(editor) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
    return new MyUploadAdapter(loader);
  };
}

function TextEditor({ value, onChange, placeholder, rows = 8, style = {}, ...props }) {
  return (
    <CKEditor
      editor={ClassicEditor}
      data={value}
      onChange={(event, editor) => {
        const data = editor.getData();
        onChange({ target: { value: data } });
      }}
      config={{
        placeholder: placeholder,
        height: style.height || '200px',
        extraPlugins: [MyCustomUploadAdapterPlugin],
      }}
      {...props}
    />
  );
}

export default TextEditor;