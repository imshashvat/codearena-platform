import sys
import io
import threading
import traceback

# Time limit (seconds)
TIME_LIMIT = 2


class CodeExecutor:
    def __init__(self, code, input_data):
        self.code = code
        self.input_data = input_data
        self.output = ""
        self.error = None

    def run(self):
        try:
            # Redirect input
            sys.stdin = io.StringIO(self.input_data + "\n")

            # Redirect output
            buffer = io.StringIO()
            sys.stdout = buffer

            # Execute user code
            exec(self.code, {})

            self.output = buffer.getvalue()

        except Exception:
            self.error = traceback.format_exc()

        finally:
            sys.stdin = sys.__stdin__
            sys.stdout = sys.__stdout__


def main():

    # Read code from stdin (PIPE)
    code = sys.stdin.read()

    # Read input from argument
    if len(sys.argv) >= 2:
        input_data = sys.argv[1]
    else:
        input_data = ""

    executor = CodeExecutor(code, input_data)

    t = threading.Thread(target=executor.run)
    t.start()
    t.join(TIME_LIMIT)

    if t.is_alive():
        print("Time Limit Exceeded")
        return

    if executor.error:
        print("Runtime Error")
        return

    print(executor.output.strip())


if __name__ == "__main__":
    main()
