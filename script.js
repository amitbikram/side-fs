/**
 * chrome://flags/#enable-experimental-web-platform-features
 * 1. Get the source config.
 * 2. Create the file names and store it in array
 * 3. Pick the local files and put it in an array
 * 4. Compare local file array and created file array
 *  a. If there is a match -> ignore
 *  b. If token matches rename the local file with new filename 
 *  c. Create local files which with remote file name
 *  d. remove reduntant local files.
 *  e. check local and remote file list.
 */
(() => {
    const EXT = 'txt';
    const SEPARATOR = '_';
    
    async function mergeFiles(remoteFiles, localFiles, fileHandles, dirHandle) {
        let processedLocalFiles = new Array(localFiles.length).fill(false);
        let processedRemoteFiles = new Array(remoteFiles.length).fill(false);
        
        for (let i = 0; i < remoteFiles.length; i++) {
            for (let j = 0; j < localFiles.length; j++) {
                if(processedRemoteFiles[i] === true || processedLocalFiles[j] === true ) {
                    continue;
                }
    
                if(remoteFiles[i] === localFiles[j]) {
                    processedRemoteFiles[i] = true;
                    processedLocalFiles[j] = true;
                    continue;
                }
    
                if(isSameFile(remoteFiles[i], localFiles[j])) {
                    // rename local files
                    await fileHandles[j].move(remoteFiles[i]);
                    processedRemoteFiles[i] = true;
                    processedLocalFiles[j] = true;
                    continue;
                }
            }    
        }
    
        for (let i = 0; i < processedRemoteFiles.length; i++) {
            if(processedRemoteFiles[i] === false) {
                //create local files with name remoteFiles[i]
                await dirHandle.getFileHandle(remoteFiles[i], { create: true });
                processedRemoteFiles[i] === true;
            } 
        }
    
        for (let i = 0; i < processedLocalFiles.length; i++) {
            if(processedLocalFiles[i] === false) {
                //remove local files with name localFiles[i]
                await dirHandle.removeEntry(localFiles[i]);
                processedLocalFiles[i] = true;
            }
        }
    }
    
    function isSameFile(remoteFile, localFile) {
        const remoteFileSplit = remoteFile.split(/[._]/);
        const localFileSplit = localFile.split(/[._]/);
        const set1 = new Set(remoteFileSplit);
        const set2 = new Set(localFileSplit);
        return remoteFileSplit.every(item => set2.has(item)) && 
            localFileSplit.every(item => set1.has(item))
    }
    
    async function getConfig() {
        data = await fetch("/data.json")
        return data.json();
    }
    
    async function createFileArray() {
        let fileArray = [];
        let { data } = await getConfig();
        for (let i = 0; i < data.length; i++) {
            let str = "";
            for (let j = i; j < data.length; j++) {
                str +=data[j];
                fileArray.push(`${str}.${EXT}`);
                str += SEPARATOR;
            }
        }
        return fileArray;
    }
    
    document.querySelector('#create').addEventListener('click', async () => {
        let fileName = document.querySelector("#name").value;
        const dirHandle = await window.showDirectoryPicker();
        const newDirectoryHandle = await dirHandle.getDirectoryHandle(fileName, {
            create: true,
    
        });
        let fileArray = await createFileArray();
        for (let i = 0; i < fileArray.length; i++) {
            await newDirectoryHandle.getFileHandle(fileArray[i], { create: true });
        }
    });
    
    document.querySelector('#select').addEventListener('click', async () => {
        let localFiles = [];
        let fileHandles = [];
        const dirHandle = await window.showDirectoryPicker(); 
        let remoteFiles = await createFileArray();
        for await (const entry of dirHandle.values()) {
            if(entry.kind === 'file') {
                fileHandles.push(entry);
                localFiles.push(entry.name);
            }
        }
        await mergeFiles(remoteFiles, localFiles, fileHandles, dirHandle);
    });
        
})()