import type * as IBrowserFS from "browserfs";
import type IsoFS from "browserfs/dist/node/backend/IsoFS";
import type MountableFileSystem from "browserfs/dist/node/backend/MountableFileSystem";
import type ZipFS from "browserfs/dist/node/backend/ZipFS";
import type { BFSCallback } from "browserfs/dist/node/core/file_system";
import type { FSModule } from "browserfs/dist/node/core/FS";
import FileSystemConfig from "contexts/fileSystem/FileSystemConfig";
import { extname } from "path";
import * as BrowserFS from "public/libs/browserfs/browserfs.min.js";
import { useEffect, useState } from "react";
import { EMPTY_BUFFER } from "utils/constants";

export type FileSystemContextState = {
  fs?: FSModule;
  mountFs: (url: string, callback: () => void) => void;
  unMountFs: (url: string) => void;
};

const { BFSRequire, configure, FileSystem } = BrowserFS as typeof IBrowserFS;

const useFileSystemContextState = (): FileSystemContextState => {
  const [fs, setFs] = useState<FSModule>();
  const rootFs = fs?.getRootFS() as MountableFileSystem;
  const mountFs = (url: string, callback: () => void): void =>
    fs?.readFile(url, (_readError, fileData = EMPTY_BUFFER) => {
      const isISO = extname(url) === ".iso";
      const createFs: BFSCallback<IsoFS | ZipFS> = (_createError, newFs) => {
        if (newFs) {
          rootFs?.mount(url, newFs);
          callback();
        }
      };

      if (isISO) {
        FileSystem.IsoFS.Create({ data: fileData }, createFs);
      } else {
        FileSystem.ZipFS.Create({ zipData: fileData }, createFs);
      }
    });
  const unMountFs = (url: string): void => rootFs?.umount(url);

  useEffect(() => {
    if (!fs) {
      configure(FileSystemConfig, () => setFs(BFSRequire("fs")));
    }
  }, [fs]);

  return { fs, mountFs, unMountFs };
};

export default useFileSystemContextState;
