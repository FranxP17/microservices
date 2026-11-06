using System;
using System.Collections.Generic;
using System.Text;

namespace Auth.Domain.Exceptions
{
    public class UserAlreadyExistsException (string message) : Exception(message)
    {
    }
} 
