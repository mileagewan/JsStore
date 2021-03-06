import { In } from "./in";

export class Regex extends In {
    protected executeRegexLogic(column: string, exp: RegExp) {
        let cursor: IDBCursorWithValue;
        this.regexExpression = exp;
        const cursorRequest = this.objectStore.index(column).openCursor();

        cursorRequest.onsuccess = (e: any) => {
            cursor = e.target.result;
            if (cursor) {
                if (this.regexTest(cursor.key) &&
                    this.whereCheckerInstance.check(cursor.value)) {
                    cursor.delete();
                    ++this.rowAffected;
                }
                cursor.continue();
            }
            else {
                this.onQueryFinished();
            }
        };
        cursorRequest.onerror = this.onErrorOccured.bind(this);
    }
}