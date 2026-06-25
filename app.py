from flask import Flask, request, jsonify

app = Flask(__name__)

def get_numbers_or_error(req):
    """Helper function to parse and validate 'a' and 'b' from query parameters."""
    a_raw = req.args.get('a')
    b_raw = req.args.get('b')
    
    if a_raw is None or b_raw is None:
        return None, None, "Missing query parameters 'a' or 'b'."
        
    try:
        a = float(a_raw)
        b = float(b_raw)
        # Convert to int if it's a whole number, just for cleaner JSON output
        if a.is_integer(): a = int(a)
        if b.is_integer(): b = int(b)
        return a, b, None
    except ValueError:
        return None, None, "Parameters 'a' and 'b' must be valid numbers."

@app.route('/', methods=['GET'])
def calculate():
    # 1. Parse and validate inputs
    a, b, error_msg = get_numbers_or_error(request)
    if error_msg:
        return jsonify({"error": error_msg}), 400

    # 2. Get the operation (defaults to 'add' if not specified)
    # This allows you to use the same endpoint for sub, mul, and div!
    operation = request.args.get('op', 'add').lower()
    
    # 3. Perform the math
    if operation == 'add':
        result = a + b
    elif operation == 'sub':
        result = a - b
    elif operation == 'multiplication' or operation == 'mul':
        result = a * b
        operation = 'multiplication' # standardizes the output name
    elif operation == 'division' or operation == 'div':
        if b == 0:
            return jsonify({"error": "Division by zero is not allowed."}), 400
        result = a / b
        operation = 'division'
    else:
        return jsonify({"error": f"Unsupported operation '{operation}'. Use add, sub, multiplication, or division."}), 400

    # 4. Return the exact JSON structure required
    # (Note: Valid JSON requires double quotes and colons, which Flask handles automatically)
    return jsonify({
        "a": a,
        "b": b,
        "operation": operation,
        "result": result
    })

if __name__ == '__main__':
    # Runs the server on localhost:5000
    app.run(host='localhost', port=5000, debug=True)